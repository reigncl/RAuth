import { EventEmitter } from 'events';
import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import uuid from 'uuid';
import { ConnectionStore } from '../store/ConnectionStore';
import { RAuthError } from '../util/Error';
import { JWTControl, JWTControlOption } from './JWTControl';
import { AccessToken, Data, RefreshToken, Scope, Session, UserID } from './Session';
import '../engines/MemoryEngine';

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
  constructor(private opts?: SessionControlOptions) { }

  readonly jwtControl: JWTControl = this.opts?.jwtControl instanceof JWTControl ? this.opts.jwtControl : new JWTControl(this.opts?.jwtControl);
  readonly connectionStore: ConnectionStore = this.opts?.connectionStore ?? new ConnectionStore(this.opts?.engineConnectionStore ?? 'Memory');
  readonly accessTokenExpires: string | number = this.opts?.accessTokenExpires ?? '1h';
  readonly refreshTokenExpires: string | number = this.opts?.refreshTokenExpires ?? '4w';
  readonly events = new EventEmitter();

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

  async createUnregisterSession(
    userId: string,
    scope: string,
    data?: Data,
    signOptions?: SignOptions,
  ) {
    const session = Session.from(
      {
        scope,
        data,
        userId: userId.toString(),
        sessionId: uuid(),
      },
      this,
    );

    return session;
  }

  async refreshSession(refreshToken: RefreshToken, options?: { data?: Data }): Promise<Session> {
    const tokenDecoded = this.jwtControl.verify(refreshToken, {
      subject: 'refresh_token',
    });

    const register = await this.connectionStore.findById(tokenDecoded.sessionId);

    if (!register) {
      throw new RAuthError('Not found Session');
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
