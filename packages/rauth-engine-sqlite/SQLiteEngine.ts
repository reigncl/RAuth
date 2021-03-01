import { tmpdir } from 'os';
import { Database, open } from 'sqlite';
import { cached } from 'sqlite3';
import { ConnectionStore } from 'rauth-core/store/ConnectionStore';
import { Engine } from 'rauth-core/store/Engine';
import { Register } from 'rauth-core/store/Register';
import { v4 as uuid } from 'uuid';
import ow from 'ow';
import { Mode } from 'rauth-core/global-types';

declare global {
  interface EngineNames {
    'SQLite': typeof SQLiteEngine;
  }
}

export interface SQLResult {
  id?: number
  userId?: string
  scope?: string
  sessionId?: string
  meta?: string
  clientId?: string
  mode?: string
  tokenType?: string
  refreshAt?: number
  createdAt?: number
}

function resultParseSQLResult(sqlResult: SQLResult): Register {
  return {
    userId: sqlResult.userId ?? undefined,
    clientId: sqlResult.clientId ?? undefined,
    createdAt: sqlResult.createdAt ?? undefined,
    meta: sqlResult.meta ? JSON.parse(sqlResult.meta) : undefined,
    mode: sqlResult.mode as Mode ?? undefined,
    refreshAt: sqlResult.refreshAt ?? undefined,
    scope: sqlResult.scope ?? undefined,
    sessionId: sqlResult.sessionId ?? undefined,
    tokenType: sqlResult.tokenType ?? undefined,
  }
}

function prepareSQLfields(register: Register): SQLResult {
  return {
    userId: register.userId,
    clientId: register.clientId,
    createdAt: register.createdAt,
    meta: register.meta ? JSON.stringify(register.meta) : undefined,
    mode: register.mode,
    refreshAt: register.refreshAt,
    scope: register.scope,
    sessionId: register.sessionId,
    tokenType: register.tokenType,
  };
}

const preparePropsSQL = <O>(obj: O) => {
  type sA<T> = T extends string ? T : never;
  type A = sA<keyof O>;
  type B = `$${A}`;
  let fls: string[] = [];
  let vls: { [k in B]?: any } = {};
  Object.entries(obj).forEach(([k, v]) => {
    fls.push(k);
    vls[`$${k}`] = v;
  });
  return {
    fields: fls.join(','),
    fieldsPropParams: Object.keys(vls).join(','),
    params: vls,
  }
}

export enum TableDefTypes {
  CHAR,
  VARCHAR,
  BINARY,
  VARBINARY,
  TINYBLOB,
  TINYTEXT,
  TEXT,
  BLOB,
  MEDIUMTEXT,
  MEDIUMBLOB,
  LONGTEXT,
  LONGBLOB,
  ENUM,
  SET,
  BIT,
  TINYINT,
  BOOL,
  BOOLEAN,
  SMALLINT,
  MEDIUMINT,
  INT,
  INTEGER,
  BIGINT,
  FLOAT,
  DOUBLE,
  'DOUBLE PRECISION',
  DECIMAL,
  DEC,
  DATE,
  DATETIME,
  TIMESTAMP,
  TIME,
  YEAR,
}

const typesArgs = (type: TableDefTypes, args: {
  fsp?: string;
  size?: number;
  d?: string;
  p?: string;
}) => {
  const fa = (a: any[]) => (a.filter(Boolean).length >= 1) ? `(${a.join(',')})` : ''

  switch (type) {
    case TableDefTypes.CHAR:
    case TableDefTypes.VARCHAR:
    case TableDefTypes.BINARY:
    case TableDefTypes.VARBINARY:
    case TableDefTypes.TEXT:
    case TableDefTypes.BLOB:
    case TableDefTypes.BIT:
    case TableDefTypes.TINYINT:
    case TableDefTypes.SMALLINT:
    case TableDefTypes.MEDIUMINT:
    case TableDefTypes.INT:
    case TableDefTypes.INTEGER:
    case TableDefTypes.BIGINT:
      return fa([args.size])
    case TableDefTypes.FLOAT:
    case TableDefTypes.DOUBLE:
    case TableDefTypes['DOUBLE PRECISION']:
    case TableDefTypes.DECIMAL:
    case TableDefTypes.DEC:
      return fa([args.size, args.d])
    case TableDefTypes.DATETIME:
    case TableDefTypes.TIMESTAMP:
    case TableDefTypes.TIME:
      return fa([args.fsp]);
    default: return '';
  }
}

export type PropTableDef = {
  type: TableDefTypes;
  fsp?: string;
  size?: number;
  d?: string;
  p?: string;
  primaryKey?: boolean;
  autoincrement?: boolean;
  unique?: boolean;
  notNull?: boolean;
};

export interface TableDef {
  /** @doc https://www.w3schools.com/sql/sql_datatypes.asp */
  [k: string]: PropTableDef;
}

const prepareTableStatement = (tableDef: TableDef) => {
  const columns: string[] = []

  const columnsStr = Object.entries(tableDef).map(([columnName, columnDef]) => {
    const columnType = `${TableDefTypes[columnDef.type]}${typesArgs(columnDef.type, {
      size: columnDef.size,
      d: columnDef.d,
      p: columnDef.p,
      fsp: columnDef.fsp,
    })}`;

    const column = [
      columnName,
      columnType,
      columnDef.primaryKey ? 'PRIMARY KEY' : false,
      columnDef.autoincrement ? 'AUTOINCREMENT' : false,
      columnDef.notNull ? 'NOT NULL' : false,
      columnDef.unique ? 'UNIQUE' : false,
    ]
      .filter(Boolean)
      .join(' ');

    return column;
  });

  return columnsStr;
}

export interface SQLiteEngineOptions {
  filename?: string
  table?: string
  tableStatement?: TableDef
}

export class SQLiteEngine implements Engine {
  sqlite: Promise<Database>;
  table: string;

  static defaultTableStatement: ({ id: PropTableDef } & { [k in keyof Register]: PropTableDef }) = {
    id: {
      type: TableDefTypes.INTEGER,
      autoincrement: true,
      primaryKey: true,
    },
    userId: { type: TableDefTypes.TEXT },
    scope: { type: TableDefTypes.TEXT },
    sessionId: { type: TableDefTypes.TEXT, unique: true, notNull: true },
    meta: { type: TableDefTypes.TEXT },
    clientId: { type: TableDefTypes.TEXT },
    mode: { type: TableDefTypes.TEXT },
    tokenType: { type: TableDefTypes.TEXT },
    refreshAt: { type: TableDefTypes.INTEGER },
    createdAt: { type: TableDefTypes.INTEGER },
  }

  constructor(option: SQLiteEngineOptions = {}) {
    const filename: string = option.filename || `${tmpdir()}/rauth-engine-sqlite-db.sqlite`;
    this.table = option.table || 'sessions';
    this.sqlite = open({ filename, driver: cached.Database })
      .then(async (db: Database) => {
        const columnsStr = prepareTableStatement(option.tableStatement ?? SQLiteEngine.defaultTableStatement);

        await db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (${columnsStr.join(', ')});`);

        return db;
      });
  }

  withDone() {
    return Promise.all([
      this.sqlite
    ])
  }

  async deleteById(sessionId: string): Promise<boolean> {
    const db = await this.sqlite;

    await db.run(`DELETE FROM ${this.table} WHERE sessionId = $sessionId`, {
      $sessionId: sessionId,
    });

    return true;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const db = await this.sqlite;

    await db.run(`DELETE FROM ${this.table} WHERE userId = $userId`, {
      $userId: userId,
    });

    return true;
  }

  async deleteByIds(sessionIds: string[]): Promise<boolean> {
    const results = await Promise.all(sessionIds.map(
      sessionId => this.deleteById(sessionId),
    ));

    return results.every(result => result);
  }

  async update(register: Register, sets: any): Promise<Register> {
    if (!register.sessionId) return register;

    const db = await this.sqlite;

    ow(sets.refreshAt, 'sets.refreshAt', ow.number);

    await db.run(
      `UPDATE ${this.table}
      SET refreshAt = $refreshAt
      WHERE sessionId = $sessionId`,
      {
        $refreshAt: sets.refreshAt,
        $sessionId: register.sessionId,
      },
    );

    return this.findById(register.sessionId);
  }

  async findById(sessionId: string): Promise<Register> {
    const db = await this.sqlite;

    const result = await db.get<SQLResult | null>(
      `SELECT * FROM ${this.table} WHERE sessionId = $sessionId;`,
      { $sessionId: sessionId },
    );

    if (!result) {
      throw new Error('Register was not created');
    }

    return resultParseSQLResult(result);
  }

  async findByUserId(userId: string): Promise<Register[]> {
    const db = await this.sqlite;

    const results = await db.all<SQLResult[]>(
      `SELECT * FROM ${this.table} WHERE userId = $userId;`,
      { $userId: userId },
    );

    return results.map((result) => resultParseSQLResult(result));
  }

  async create(sessionRegister: Register): Promise<Register> {
    const db = await this.sqlite;

    const sessionId = uuid();

    const f = preparePropsSQL(prepareSQLfields({ sessionId, ...sessionRegister }));

    await db.run(
      `INSERT INTO ${this.table} (${f.fields}) VALUES (${f.fieldsPropParams});`,
      f.params,
    );

    const register = await this.findById(sessionId);

    if (!register) {
      throw new Error('Register was not created');
    }

    return register;
  }

  static async initialize(option: SQLiteEngineOptions = {}) {
    return new SQLiteEngine(option);
  }
}

// Default engines
ConnectionStore.add('SQLite', SQLiteEngine);
