import { EventEmitter } from 'events';
import { VerifyOptions } from 'jsonwebtoken';
import uuid from 'uuid';
import { ConnectionStore } from '../store/ConnectionStore';
import { RAuthError } from '../util/Error';
import { JWTControl, JWTControlOption } from './JWTControl';
import { AccessToken, Data, RefreshToken, Scope, Session, UserID } from './Session';

type eventsNames = 'create-session' | 'refresh-session';

interface SessionControlOptions {
  jwtControl?: JWTControl | JWTControlOption;
  engineConnectionStore?: keyof EngineNames;
  connectionStore?: ConnectionStore;
  accessTokenExpires?: string | number;
  refreshTokenExpires?: string | number;
  [otherOpt: string]: any;
}

export class SessionControl {
  jwtControl: JWTControl;
  connectionStore: ConnectionStore;
  accessTokenExpires: string | number;
  refreshTokenExpires: string | number;
  events = new EventEmitter();

  constructor({
    jwtControl = new JWTControl(),
    engineConnectionStore = '<<NO_SET>>',
    connectionStore = new ConnectionStore(engineConnectionStore),
    accessTokenExpires = '1h',
    refreshTokenExpires = '4w',
  }: SessionControlOptions = {}) {
    if (jwtControl instanceof JWTControl) {
      this.jwtControl = jwtControl;
    } else {
      this.jwtControl = new JWTControl(jwtControl);
    }
    this.connectionStore = connectionStore;
    this.accessTokenExpires = accessTokenExpires;
    this.refreshTokenExpires = refreshTokenExpires;
  }

  async verify(accessToken: AccessToken, options?: VerifyOptions): Promise<Session> {
    return Session.from(
      this.jwtControl.verify(
        accessToken,
        {
          subject: 'access_token',
          ...options,
        },
      ),
      this,
    );
  }

  async createSession(
    userId: UserID,
    scope: Scope = '',
    data?: Data,
    moreData?: any,
  ): Promise<Session> {
    const register = await this.connectionStore.create({
      userId,
      scope,
      sessionId: uuid(),
      createdAt: Date.now(),
      refreshAt: Date.now(),
      ...moreData,
    });

    register.data = data;

    this.emit('create-session', { register });

    return Session.from(register, this);
  }

  async refreshSession(refreshToken: RefreshToken, options?: { data?: Data }): Promise<Session> {
    const tokenDecoded = this.jwtControl.verify(refreshToken, {
      subject: 'refresh_token',
    });

    const register = await this.connectionStore.findById(tokenDecoded.sessionId);

    if (!register) {
      throw new RAuthError('Not found Register');
    }

    if (tokenDecoded.refreshAt.toString() !== register.refreshAt.toString()) {
      throw new RAuthError('Token is not valid');
    }

    const nextRegister = await this.connectionStore.update(register, {
      refreshAt: Date.now(),
    });

    nextRegister.data = options?.data;

    this.emit('refresh-session', { register: nextRegister });

    return Session.from(nextRegister, this);
  }

  async revokeSession(session: Required<Pick<Session, 'sessionId'>> & Session): Promise<boolean> {
    if (session.sessionId) {
      return this.connectionStore.deleteById(session.sessionId);
    }

    return false;
  }

  async revokeAllSessions(session: Required<Pick<Session, 'userId'>> & Session): Promise<boolean> {
    if (session.userId) {
      return this.connectionStore.deleteByUserId(session.userId);
    }

    return false;
  }

  async getAllSessions(session: Required<Pick<Session, 'userId'>> & Session): Promise<Session[]> {
    const registers = session.userId ? await this.connectionStore.findByUserId(session.userId) : [];

    return registers.map(
      register =>
        Session.from(register, this),
    );
  }

  emit(event: eventsNames, ...args: any[]) {
    return this.events.emit(event, ...args);
  }

  on(event: eventsNames, listener: (...args: any[]) => void) {
    return this.events.on(event, listener);
  }
}
