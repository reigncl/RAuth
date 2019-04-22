import os from 'os';
// @ts-ignore
import { Database, open } from 'sqlite';
import { StrictSessionRegister } from '../session/Session';
import { ConnectionStore } from '../store/ConnectionStore';
import { Engine } from '../store/Engine';
import { Register } from '../store/Register';
import uuid = require('uuid');
import ow from 'ow';

interface RegisterRow {
  id: number;
  sessionId: string;
  userId: string;
  createdAt: number;
  scope: string;
  data: string;
  refreshAt: string;
}

declare global {
  interface EngineNames {
    'SQLite': string;
  }
}

export class SQLiteEngine implements Engine {
  sqlite: Promise<Database>;
  table: string;

  constructor(option: any = {}) {
    const filename: string = option.filename || `${os.tmpdir()}/db.sqlite`;
    this.table = option.table || 'sessions';
    this.sqlite = open(filename, {
      promise: Promise,
      cached: true,
    })
      .then(async (db: any) => {
        await db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (
          id INT PRIMARY KEY,
          sessionId TEXT UNIQUE,
          userId TEXT,
          createdAt SMALLDATETIME,
          scope TEXT,
          data TEXT,
          refreshAt SMALLDATETIME
        );`);

        return db;
      });
  }

  async deleteById(sessionId: string): Promise<boolean> {
    const db = await this.sqlite;

    await db.run(`DELETE FROM ${this.table} WHERE sessionId = $sessionId`, {
      $sessionId: sessionId,
    });

    return true;
  }

  async update(register: Register, sets: any): Promise<Register> {
    const db = await this.sqlite;

    ow(sets.refreshAt, 'sets.refreshAt', ow.number);

    await db.run(`
      UPDATE ${this.table}
      SET refreshAt = $refreshAt
      WHERE sessionId = $sessionId
    `,           {
      $refreshAt: sets.refreshAt,
      $sessionId: register.sessionId,
    });

    return this.findById(register.sessionId);
  }

  async findById(sessionId: string): Promise<Register> {
    const db = await this.sqlite;

    const result = await db.get<RegisterRow>(`
      SELECT * FROM ${this.table} WHERE sessionId = $sessionId;
    `,                                       {
      $sessionId: sessionId,
    });

    if (!result) {
      throw new Error('Register was not created');
    }

    const { data, ...res } = result;

    return {
      ...res,
      data: JSON.parse(data),
    };
  }

  async create(sessionRegister: StrictSessionRegister): Promise<Register> {
    const db = await this.sqlite;

    const sessionId = uuid();

    await db.run(
      `INSERT INTO ${this.table}
      VALUES (
        $id,
        $sessionId,
        $userId,
        $createdAt,
        $scope,
        $data,
        $refreshAt
      );`,
      {
        $id: Date.now(),
        $sessionId: sessionId,
        $userId: sessionRegister.userId,
        $createdAt: Date.now(),
        $scope: sessionRegister.scope,
        $data: JSON.stringify(sessionRegister.data),
        $refreshAt: Date.now(),
      },
    );

    const register = await this.findById(sessionId);

    if (!register) {
      throw new Error('Register was not created');
    }

    return register;
  }
}

// Default engines
ConnectionStore.add('SQLite', SQLiteEngine);
