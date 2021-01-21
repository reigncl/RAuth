import { expect } from 'chai';
import uuid = require('uuid');
import { Register } from '../store/Register';
import { MemoryEngine } from './MemoryEngine';


describe('MemoryEngine tests', () => {
  let engine: MemoryEngine;

  beforeEach(() => {
    engine = new MemoryEngine();
  });

  afterEach(() => {
  });

  describe('deleteById function', () => {
    it('deleteById - empty sessionId', async () => {
      const isDeleted = await engine.deleteById('');
      expect(isDeleted).to.be.equal(false);
    });

    it('deleteById - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: Register = {
        sessionId,
        userId: sessionId,
        scope: '',
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      await engine.create(sessionRegister);

      const isDeleted = await engine.deleteById(sessionId);
      expect(isDeleted).to.equal(true);
    });
  });

  describe('deleteByUserId function', () => {
    it('deleteByUserId - empty userId', async () => {
      const isDeleted = await engine.deleteByUserId('');
      expect(isDeleted).to.equal(true);
    });

    it('deleteByUserId - ok', async () => {
      const userId = uuid();

      for (let i = 0; i < 3; i += 1) {
        const sessionRegister = {
          userId,
          sessionId: uuid(),
          scope: '',
          createdAt: Date.now(),
          refreshAt: Date.now(),
        };

        await engine.create(sessionRegister);
      }


      let allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(3);
      expect(engine['memory'].size).to.be.equal(3);
      const isDeleted = await engine.deleteByUserId(userId);
      expect(isDeleted).to.equal(true);
      expect(engine['memory'].size).to.be.equal(0);
      allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(0);
    });
  });

  describe('deleteByIds function', () => {
    it('deleteByIds - empty sessionIds', async () => {
      const isDeleted = await engine.deleteByIds([]);
      // always return true
      expect(isDeleted).to.equal(true);
    });

    it('deleteByIds - ok', async () => {
      const userId = uuid();
      const sessionIds: string[] = [];

      for (let i = 0; i < 3; i += 1) {
        const sessionId = uuid();
        sessionIds.push(sessionId);
        const sessionRegister = {
          userId,
          sessionId,
          scope: '',
          createdAt: Date.now(),
          refreshAt: Date.now(),
        };

        await engine.create(sessionRegister);
      }

      let allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(3);
      expect(engine['memory'].size).to.be.equal(3);
      const isDeleted = await engine.deleteByIds(sessionIds);
      expect(isDeleted).to.equal(true);
      allSessionEngines = await engine.findByUserId(userId);
      expect(engine['memory'].size).to.be.equal(0);
      expect(allSessionEngines).to.length(0);
    });
  });

  describe('update function', () => {
    it('update - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: Register = {
        sessionId,
        userId: sessionId,
        scope: '',
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      await engine.create(sessionRegister);
      await engine.update(sessionRegister, {
        meta: {
          username: 'exequiel',
          role: 'admin',
        },
      });
      const sessionEngine = await engine.findById(sessionId);

      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'meta',
        'createdAt', 'refreshAt');
      // @ts-ignore
      expect(sessionEngine.meta.username).to.equals('exequiel');
      // @ts-ignore
      expect(sessionEngine.meta.role).to.equals('admin');
    });
  });

  describe('findById function', () => {
    it('findById - empty sessionId', async () => {
      const sessionEngine = await engine.findById('').catch(e => e);
      expect(sessionEngine).to.be.instanceOf(Error);
    });

    it('findById - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: Register = {
        sessionId,
        userId: sessionId,
        scope: '',
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      await engine.create(sessionRegister);

      const sessionEngine = await engine.findById(sessionId);
      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'createdAt', 'refreshAt');
    });
  });

  describe('findByUserId function', () => {
    it('findByUserId - empty userId', async () => {
      const sessionEngine = await engine.findByUserId('');
      expect(sessionEngine).to.length(0);
    });

    it('findByUserId - ok', async () => {
      const userId = uuid();
      let sessionRegister: Register;

      for (let i = 0; i < 3; i += 1) {
        sessionRegister = {
          userId,
          sessionId: uuid(),
          scope: '',
          createdAt: Date.now(),
          refreshAt: Date.now(),
        };

        await engine.create(sessionRegister);
      }

      const allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(3);
    });
  });

  describe('create function', () => {
    it('create - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: Register = {
        sessionId,
        userId: sessionId,
        scope: '',
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      const sessionEngine = await engine.create(sessionRegister);
      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'createdAt', 'refreshAt');
    });
  });
});
