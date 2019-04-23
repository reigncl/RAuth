import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ow from 'ow';
import '../engines/MemoryEngine';
import { SessionControl } from '../session/SessionControl';

chai.use(chaiAsPromised);

function createObjectSessionControl() {
  return new SessionControl({
    engineConnectionStore: 'Memory',
  });
}

describe('Session Control', () => {
  it('Create instace session control', () => {
    createObjectSessionControl();
  });

  it('create session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession('me', '', {
      role: 'Admin Cool',
      name: 'Jona',
      email: 'email@sample.com',
    });

    const sessionId = session.sessionId;

    ow(sessionId, ow.string);

    const firstCredentials = session.toJSON();
    ow(firstCredentials, ow.object.exactShape({
      access_token: ow.string,
      refresh_token: ow.string,
    }));
  });

  it('refresh session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession('me', '', {
      role: 'Admin Cool',
      name: 'Jona',
      email: 'email@sample.com',
    });

    const firstCredentials = session.toJSON();

    const secondSession = await sessionControl.refreshSession(session.refreshToken);

    const secondCredential = secondSession.toJSON();

    expect(secondCredential.access_token).not.equals(firstCredentials.access_token);
    expect(secondCredential.refresh_token).not.equals(firstCredentials.refresh_token);
  });

  it('revoke session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession('me', '', {
      role: 'Admin Cool',
      name: 'Jona',
      email: 'email@sample.com',
    });

    await sessionControl.revokeSession(session);

    await expect(
      sessionControl.refreshSession(session.refreshToken),
      'Refresh session revoked',
    ).rejected;
  });

  it('get all sessions', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession('user1');

    await Promise.all([
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
    ]);

    const sessions = await sessionControl.getAllSessions(session);

    expect(sessions).to.length(7);
  });

  it('Reveke all session', async () => {
    const sessionControl = createObjectSessionControl();

    const session = await sessionControl.createSession('user1');

    await Promise.all([
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
      sessionControl.createSession('user1'),
    ]);

    expect(await sessionControl.revokeAllSessions(session)).to.be.eql(true);

    const sessions = await sessionControl.getAllSessions(session);

    expect(sessions).to.length(0);
  });
});
