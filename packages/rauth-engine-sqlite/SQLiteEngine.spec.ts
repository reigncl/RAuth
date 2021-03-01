
import { SQLiteEngine } from './SQLiteEngine';
import { unlinkSync } from 'fs';

const sqlEngine = new class {
  inst?: SQLiteEngine;

  async clear() {
    await (await this.inst?.sqlite).close();
    unlinkSync(this.filename());
    this.inst = undefined;
  }

  init() {
    this.inst = new SQLiteEngine({
      filename: this.filename()
    });
  }

  private filename(): string {
    return `${__dirname}/asb.sqlite`;
  }

  async getSQLiteEngine() {
    const inst = this.inst
    if (inst) return inst;
    throw new Error('Is not init sqlite engine. Please use sqlEngine.init().');
  }
}

describe('SQL Lite Engine', () => {
  beforeAll(async () => {
    await sqlEngine.init();
    await sqlEngine.inst?.withDone();
  });

  afterAll(async () => {
    await sqlEngine.clear();
  })

  it('List engine', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();
  });

  it('Insert One', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();

    const reg = await sqliteEngine.create({
      clientId: 'clientId123123',
    });

    expect(reg).toHaveProperty('userId');
    expect(reg).toHaveProperty('clientId');
    expect(reg).toHaveProperty('createdAt');
    expect(reg).toHaveProperty('meta');
    expect(reg).toHaveProperty('mode');
    expect(reg).toHaveProperty('refreshAt');
    expect(reg).toHaveProperty('scope');
    expect(reg).toHaveProperty('sessionId');
    expect(reg).toHaveProperty('tokenType');
  });

  it('Delete by ID', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();

    const reg = await sqliteEngine.create({
      clientId: 'clientId123123',
    });

    const r = await sqliteEngine.deleteById(reg.sessionId);

    expect(r).toBeTruthy();
  });

  it('Not found by id', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();

    try {
      await sqliteEngine.findById('not exists')
      throw new Error('ups')
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('find by userid', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();

    const userid = 'me userid'

    await sqliteEngine.create({ userId: userid, meta: { tid: 1 } });
    await sqliteEngine.create({ userId: userid, meta: { tid: 2 } });
    await sqliteEngine.create({ userId: userid, meta: { tid: 3 } });

    const docs = await sqliteEngine.findByUserId(userid);

    expect(docs).toHaveLength(3);
  });

  it('Find by id (session id)', async () => {
    const sqliteEngine = await sqlEngine.getSQLiteEngine();

    await sqliteEngine.withDone();

    const ses = await sqliteEngine.create({ meta: { tid: 1 }, userId: 'abc' });

    const sessionId = ses.sessionId

    if (!sessionId) throw new Error('Session without sessionid');

    const session = await sqliteEngine.findById(sessionId);

    expect(session).not.toBeUndefined();
  });

});
