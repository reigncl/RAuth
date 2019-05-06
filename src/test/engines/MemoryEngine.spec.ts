import { expect } from 'chai';
import uuid = require('uuid');
import { StrictSessionRegister } from '../../session/Session';
import { MemoryEngine } from '../../engines/MemoryEngine';

let engine: MemoryEngine;

describe('MemoryEngine tests', () => {
  beforeEach(() => {
    engine = new MemoryEngine();
  });

  afterEach(() => {
  });

  describe('deleteById function', () => {
    it('deleteById - empty sessionId', async () => {
      const isDeleted = await engine.deleteById('');
      expect(isDeleted).to.equal(false);
    });

    it('deleteById - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: StrictSessionRegister = {
        sessionId,
        userId: sessionId,
        scope: '',
        data: undefined,
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
      // always return true
      expect(isDeleted).to.equal(true);
    });

    it('deleteByUserId - ok', async () => {
      const userId = uuid();
      let sessionRegister: StrictSessionRegister;

      for (let i = 0; i < 3; i += 1) {
        sessionRegister = {
          userId,
          sessionId: uuid(),
          scope: '',
          data: undefined,
          createdAt: Date.now(),
          refreshAt: Date.now(),
        };

        await engine.create(sessionRegister);
      }

      let allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(3);
      const isDeleted = await engine.deleteByUserId(userId);
      expect(isDeleted).to.equal(true);
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
      let sessionId;
      const sessionIds = [];
      let sessionRegister: StrictSessionRegister;

      for (let i = 0; i < 3; i += 1) {
        sessionId = uuid();
        sessionIds.push(sessionId);
        sessionRegister = {
          userId,
          sessionId,
          scope: '',
          data: undefined,
          createdAt: Date.now(),
          refreshAt: Date.now(),
        };

        await engine.create(sessionRegister);
      }

      let allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(3);
      const isDeleted = await engine.deleteByIds(sessionIds);
      expect(isDeleted).to.equal(true);
      allSessionEngines = await engine.findByUserId(userId);
      expect(allSessionEngines).to.length(0);
    });
  });

  describe('update function', () => {
    it('update - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: StrictSessionRegister = {
        sessionId,
        userId: sessionId,
        scope: '',
        data: undefined,
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      await engine.create(sessionRegister);
      const sessionEngine = await engine.update(sessionRegister, {
        data: {
          username: 'exequiel',
          role: 'admin',
        },
      });

      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'data',
                                         'createdAt', 'refreshAt');
      // @ts-ignore
      expect(sessionEngine.data.username).to.equals('exequiel');
      // @ts-ignore
      expect(sessionEngine.data.role).to.equals('admin');
    });
  });

  describe('findById function', () => {
    it('findById - empty sessionId', async () => {
      const sessionEngine = await engine.findById('');
      expect(sessionEngine).to.equal(undefined);
    });

    it('findById - ok', async () => {
      const sessionId = uuid();
      const sessionRegister: StrictSessionRegister = {
        sessionId,
        userId: sessionId,
        scope: '',
        data: undefined,
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      await engine.create(sessionRegister);

      const sessionEngine = await engine.findById(sessionId);
      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'data',
                                         'createdAt', 'refreshAt');
    });
  });

  describe('findByUserId function', () => {
    it('findByUserId - empty userId', async () => {
      const sessionEngine = await engine.findByUserId('');
      expect(sessionEngine).to.length(0);
    });

    it('findByUserId - ok', async () => {
      const userId = uuid();
      let sessionRegister: StrictSessionRegister;

      for (let i = 0; i < 3; i += 1) {
        sessionRegister = {
          userId,
          sessionId: uuid(),
          scope: '',
          data: undefined,
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
      const sessionRegister: StrictSessionRegister = {
        sessionId,
        userId: sessionId,
        scope: '',
        data: undefined,
        createdAt: Date.now(),
        refreshAt: Date.now(),
      };

      const sessionEngine = await engine.create(sessionRegister);
      expect(sessionEngine).to.be.an('object');
      expect(sessionEngine).to.have.keys('sessionId', 'userId', 'scope', 'data',
                                         'createdAt', 'refreshAt');
    });
  });
});
