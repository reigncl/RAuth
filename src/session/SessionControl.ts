import { JWTControl } from './JWTControl';
import { AccessToken, Session, UserID, Data, RefreshToken, Scope } from './Session';
import { ConnectionStore } from '../store/ConnectionStore';
import uuid from 'uuid';
import { RAuthError } from '../util/Error';

declare global {
  interface EngineNames {
    '<<NO_SET>>': string;
  }
}

interface SessionControlOptions {
  jwtControl?: JWTControl;
  engineConnectionStore?: keyof EngineNames;
  connectionStore?: ConnectionStore;
  [otherOpt: string]: any;
}

export class SessionControl {
  jwtControl: JWTControl;
  connectionStore: ConnectionStore;

  constructor({
    jwtControl = new JWTControl(),
    engineConnectionStore = '<<NO_SET>>',
    connectionStore = new ConnectionStore(engineConnectionStore),
  }: SessionControlOptions = {}) {
    this.jwtControl = jwtControl;
    this.connectionStore = connectionStore;
  }

  async verify(accessToken: AccessToken): Promise<Session> {
    return Session.from(this.jwtControl.verify(accessToken), this);
  }

  async createSession(userId: UserID, scope: Scope = '', data?: Data): Promise<Session> {
    const register = await this.connectionStore.create({
      userId,
      scope,
      data,
      sessionId: uuid(),
    });

    return Session.from(register, this);
  }

  async refreshSession(refreshToken: RefreshToken): Promise<Session> {
    const tokenDecoded = this.jwtControl.verify(refreshToken);
    const register = await this.connectionStore.findById(tokenDecoded.sessionId);

    if (!register) {
      throw new RAuthError('Not found Register');
    }

    if (tokenDecoded.refreshAt !== register.refreshAt) {
      throw new RAuthError('Token is not valid');
    }

    return Session.from(
      await this.connectionStore.update(register, {
        refreshAt: Date.now(),
      }),
      this,
    );
  }

  async revokeSession(session: Required<Pick<Session, 'sessionId'>> & Session): Promise<boolean> {
    await this.connectionStore.deleteById(session.sessionId);
    return true;
  }
}
