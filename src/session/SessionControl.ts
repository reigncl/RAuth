import { EventEmitter } from 'events';
import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import uuid from 'uuid';
import { ConnectionStore } from '../store/ConnectionStore';
import { RAuthError } from '../util/Error';
import { JWTControl, JWTControlOption } from './JWTControl';
import { AccessToken, Data, RefreshToken, Scope, Session, SessionBodyFrom, UserID } from './Session';
import '../engines/MemoryEngine';
import { Register } from '../store/Register';

type eventsNames = {
  'create-session': [opt: { register: Register }]
  'refresh-session': [register: Register]
  'create-unregister-session': [opt: { session: Session }]
};

interface SessionControlOptions {
  jwtControl?: JWTControl | JWTControlOption;
  engineConnectionStore?: keyof EngineNames;
  connectionStore?: ConnectionStore;
  accessTokenExpires?: string | number;
  refreshTokenExpires?: string | number;
  [otherOpt: string]: any;
}

type CreateSessionOptions =
  | [
    userId: UserID,
    scope?: Scope,
    data?: Data,
    moreData?: any,
  ]
  | [sessionBodyFrom: SessionBodyFrom]

const createSessionOptionsToBodySession = (opts: CreateSessionOptions): SessionBodyFrom => {
  if (typeof opts[0] === 'string') {
    const [userId, scope, data, moreData] = opts;
    return { userId, scope, data, moreData };
  }

  if (typeof opts[0] === 'object') {
    const [sessionBodyFrom] = opts;

    return sessionBodyFrom;
  }

  throw new Error('Parameters invalid');
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

  async createSession(...opts: CreateSessionOptions): Promise<Session> {
    const bodySession = createSessionOptionsToBodySession(opts);
    const session = Session.from({
      sessionId: uuid(),
      ...bodySession,
      createdAt: bodySession.createdAt ?? Date.now(),
      refreshAt: bodySession.refreshAt ?? Date.now(),
    }, this);

    const register = await this.connectionStore.create(session.getRegister());

    this.emit('create-session', { register });

    return Session.from(register, this);
  }

  async createUnregisterSession(...opts: CreateSessionOptions) {
    const bodySession = createSessionOptionsToBodySession(opts);
    const session = Session.from({
      sessionId: uuid(),
      mode: 'OnlyAccessToken',
      ...bodySession,
      createdAt: bodySession.createdAt ?? Date.now(),
    }, this);
    this.emit('create-unregister-session', { session });
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

    if (tokenDecoded.refreshAt.toString() !== register.refreshAt?.toString()) {
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

  emit<T extends keyof eventsNames>(event: T, ...args: eventsNames[T]) {
    return this.events.emit(event, ...args);
  }

  on<T extends keyof eventsNames>(event: T, listener: (...args: eventsNames[T]) => void) {
    return this.events.on(event, listener as any);
  }
}
