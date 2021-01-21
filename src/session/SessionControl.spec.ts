import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ow from 'ow';
import '../engines/MemoryEngine';
import { SessionControl } from './SessionControl';
import jsonwebtoken from 'jsonwebtoken';
import util from 'util';
import { utils } from 'mocha';

chai.use(chaiAsPromised);

function createObjectSessionControl() {
  return new SessionControl({
    engineConnectionStore: 'Memory',
  });
}

describe('Session Control', () => {
  it('Create instance session control', () => {
    createObjectSessionControl();
  });

  it('Create session with scope string', async () => {
    const sessionControl = createObjectSessionControl();

    const session1 = await sessionControl.createSession({
      userId: 'me',
      scope: 'a b c',
      data: {
        role: 'Admin Cool',
        name: 'Jona',
        email: 'email@sample.com',
      }
    });

    const session2 = await sessionControl.createSession({
      userId: 'me',
      scope: 'a b c',
      data: {
        role: 'Admin Cool',
        name: 'Jona',
        email: 'email@sample.com'
      },
    });

    const s1: any = jsonwebtoken.decode(session1.accessToken);
    const s2: any = jsonwebtoken.decode(session2.accessToken);

    expect(s1.scope).is.eql('a b c');
    expect(s2.scope).is.eql('a b c');
  });

  it('Create session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession({
      userId: 'me',
      scope: '',
      data: {
        role: 'Admin Cool',
        name: 'Jona',
        email: 'email@sample.com',
      },
    });

    const sessionId = session.sessionId;

    ow(sessionId, ow.string);

    const firstCredentials = session.toJSON();
    ow(firstCredentials, ow.object.partialShape({
      access_token: ow.string,
      refresh_token: ow.string,
      expires_in: ow.number,
    }));
  });

  it('Refresh session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession({
      userId: 'me',
      scope: '',
      data: {
        role: 'Admin Cool',
        name: 'Jona',
        email: 'email@sample.com',
      },
    });

    await util.promisify(setTimeout)(500);

    const firstCredentials = session.toJSON();

    const secondSession = await sessionControl.refreshSession(session.refreshToken);

    const secondCredential = secondSession.toJSON();

    expect(secondCredential.access_token).not.equals(firstCredentials.access_token);
    expect(secondCredential.refresh_token).not.equals(firstCredentials.refresh_token);
  });

  it('refresh token with update option session', async () => {
    const sessionControl = createObjectSessionControl();
    const firstSession = await sessionControl.createSession({ data: { foo: 'bar' }, meta: { ips: ['a'] } });
    const firstToken = firstSession.toToken();
    const decodeFirstToken = jsonwebtoken.decode(firstToken.access_token, { json: true });

    const register1 = await sessionControl.connectionStore.findById(decodeFirstToken?.sessionId)
    expect(register1.meta).to.be.deep.equal({ ips: ['a'] });

    expect(decodeFirstToken?.data).to.be.deep.equal({ foo: 'bar' });
    const secondSession = await sessionControl.refreshSession(firstToken.refresh_token, { data: { foo: 'baz' }, meta: { ips_2: ['b'] } });
    const secondToken = secondSession.toToken();
    const decodeSecondToken = jsonwebtoken.decode(secondToken.access_token, { json: true });
    expect(decodeSecondToken?.data).to.be.deep.equal({ foo: 'baz' });

    const register2 = await sessionControl.connectionStore.findById(decodeFirstToken?.sessionId)
    expect(register2.meta).to.be.deep.equal({ ips: ['a'], ips_2: ['b'] });
  });

  it('refresh token using update meta with function operator', async () => {
    const sessionControl = createObjectSessionControl();
    const firstSession = await sessionControl.createSession({ data: { foo: 'bar' }, meta: { ips: ['a'] } });
    const firstToken = firstSession.toToken();
    const decodeFirstToken = jsonwebtoken.decode(firstToken.access_token, { json: true });

    const register1 = await sessionControl.connectionStore.findById(decodeFirstToken?.sessionId)
    expect(register1.meta).to.be.deep.equal({ ips: ['a'] });

    expect(decodeFirstToken?.data).to.be.deep.equal({ foo: 'bar' });
    const secondSession = await sessionControl.refreshSession(firstToken.refresh_token, { data: { foo: 'baz' }, meta: meta => ({ ...meta, ips: [...meta?.ips, 'b'] }) });
    const secondToken = secondSession.toToken();
    const decodeSecondToken = jsonwebtoken.decode(secondToken.access_token, { json: true });
    expect(decodeSecondToken?.data).to.be.deep.equal({ foo: 'baz' });

    const register2 = await sessionControl.connectionStore.findById(decodeFirstToken?.sessionId)
    expect(register2.meta).to.be.deep.equal({ ips: ['a', 'b'] });
  });

  it('Revoke session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession({
      userId: 'me',
      scope: '',
      data: {
        role: 'Admin Cool',
        name: 'Jona',
        email: 'email@sample.com',
      }
    });

    await sessionControl.revokeSession(session);

    await expect(
      sessionControl.refreshSession(session.refreshToken),
      'Refresh session revoked',
    ).rejected;
  });

  it('Get all sessions', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession({ userId: 'user1' });

    await Promise.all([
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
    ]);

    const sessions = await sessionControl.getAllSessions(session);

    expect(sessions).to.length(7);
  });

  it('Revoke all session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession({ userId: 'user1' });

    await Promise.all([
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
      sessionControl.createSession({ userId: 'user1' }),
    ]);

    expect(await sessionControl.revokeAllSessions(session)).to.be.eql(true);

    const sessions = await sessionControl.getAllSessions(session);

    expect(sessions).to.length(0);
  });

  describe('Events', () => {
    it('event create-session', async () => {
      const sessionControl = createObjectSessionControl();

      let called = false;

      sessionControl.on('create-session', () => {
        called = true;
      });

      await sessionControl.createSession({
        userId: 'me',
        scope: '',
        data: {
          role: 'Admin Cool',
          name: 'Jona',
          email: 'email@sample.com',
        }
      });

      expect(called, 'Event is called').is.true;
    });
  });

  describe('Verify Token', () => {
    it('verify token', async () => {
      const sessionControl = createObjectSessionControl();
      const session = await sessionControl.createSession({
        userId: 'me',
        meta: {
          foo: 'bar'
        },
        data: {
          name: 'Luck'
        },
      });

      const token = session.toToken();

      const sessionReading = await sessionControl.verifyAccessToken(token.access_token);

      expect(sessionReading).property('userId').equal('me');
      expect(sessionReading).property('meta').undefined;
      expect(sessionReading).property('data').deep.equal({ name: 'Luck' });
    });

    it('verify token with complete meta', async () => {
      const sessionControl = createObjectSessionControl();
      const session = await sessionControl.createSession({
        userId: 'me',
        meta: {
          foo: 'bar'
        },
        data: {
          name: 'Luck'
        },
      });

      const token = session.toToken();

      const sessionReading = await sessionControl.verifyAccessToken(token.access_token, { completeMeta: true });

      expect(sessionReading).property('userId').equal('me');
      expect(sessionReading).property('meta').deep.equal({ foo: 'bar' });
      expect(sessionReading).property('data').deep.equal({ name: 'Luck' });
    });
  });
});
