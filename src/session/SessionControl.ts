import { EventEmitter } from 'events';
import { VerifyOptions } from 'jsonwebtoken';
import uuid from 'uuid';
import { ConnectionStore } from '../store/ConnectionStore';
import { RAuthError } from '../util/Error';
import { JWTControl, JWTControlOption } from './JWTControl';
import { AccessToken, Data, OptionSession, RefreshToken, Session } from './Session';
import '../engines/MemoryEngine';
import { Register } from '../store/Register';

type eventsNames = {
  'create-session': [opt: { register: Register }]
  'refresh-session': [opt: { register: Register }]
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

type OptionsVerify = VerifyOptions & { completeMeta?: boolean }

export class SessionControl {
  constructor(private opts?: SessionControlOptions) { }

  readonly jwtControl: JWTControl = this.opts?.jwtControl instanceof JWTControl ? this.opts.jwtControl : new JWTControl(this.opts?.jwtControl);
  readonly connectionStore: ConnectionStore = this.opts?.connectionStore ?? new ConnectionStore(this.opts?.engineConnectionStore ?? 'Memory');
  readonly accessTokenExpires: string | number = this.opts?.accessTokenExpires ?? '1h';
  readonly refreshTokenExpires: string | number = this.opts?.refreshTokenExpires ?? '4w';
  readonly events = new EventEmitter();

  async verify(strToken: string, options?: OptionsVerify) {
    const { completeMeta, ...verifyOptions } = options ?? {};
    const decode = this.jwtControl.verify(
      strToken,
      verifyOptions,
    );
    return Session.from({
      ...decode,
      meta: completeMeta && decode.sessionId ? await (await this.readRegister(decode.sessionId)).meta : undefined,
      sessionControl: this,
    });
  }

  async verifyAccessToken(accessToken: AccessToken, options?: OptionsVerify) {
    return this.verify(accessToken, { ...options, subject: 'access_token' });
  }

  async verifyRefreshToken(refresh_token: RefreshToken, options?: OptionsVerify) {
    return this.verify(refresh_token, { ...options, subject: 'refresh_token' });
  }

  async readRegister(sessionId: Session['sessionId']) {
    if (!sessionId) throw new Error('refresh token no valid require sessionId');

    return await this.connectionStore.findById(sessionId);
  }

  async createSession(bodySession?: OptionSession) {
    const session = Session.from({
      sessionId: uuid(),
      ...bodySession,
      createdAt: bodySession?.createdAt ?? Date.now(),
      refreshAt: bodySession?.refreshAt ?? Date.now(),
      sessionControl: this,
    });

    const register = await this.connectionStore.create(session.getRegister());

    this.emit('create-session', { register });

    return session;
  }

  async createUnregisterSession(bodySession?: OptionSession) {
    const session = Session.from({
      sessionId: uuid(),
      mode: 'OnlyAccessToken',
      ...bodySession,
      createdAt: bodySession?.createdAt ?? Date.now(),
      sessionControl: this,
    });
    this.emit('create-unregister-session', { session });
    return session;
  }

  async refreshSession(refreshToken: RefreshToken, optionSession?: Pick<OptionSession, 'data'> & { meta?: OptionSession['meta'] | ((meta: OptionSession['meta']) => OptionSession['meta']) }): Promise<Session> {
    const session = await this.verifyRefreshToken(refreshToken);

    if (!session.sessionId) throw new Error('refresh token no valid require sessionId');

    const register = await this.readRegister(session.sessionId);

    if (session.refreshAt?.toString() !== register.refreshAt?.toString()) {
      throw new RAuthError('Token is not valid');
    }

    const nextRegister = await this.connectionStore.update(register, {
      refreshAt: Date.now(),
      meta: typeof optionSession?.meta === 'function'
        ? optionSession.meta(register?.meta)
        : {
          ...register?.meta,
          ...optionSession?.meta,
        },
    });

    this.emit('refresh-session', { register: nextRegister });

    return Session.from({
      ...nextRegister,
      data: optionSession?.data,
    });
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
        Session.from(register),
    );
  }

  emit<T extends keyof eventsNames>(event: T, ...args: eventsNames[T]) {
    return this.events.emit(event, ...args);
  }

  on<T extends keyof eventsNames>(event: T, listener: (...args: eventsNames[T]) => void) {
    return this.events.on(event, listener as any);
  }
}
