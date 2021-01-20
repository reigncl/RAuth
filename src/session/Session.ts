import ow from 'ow';
import { SessionControl } from './SessionControl';
import { JWTControl } from './JWTControl';
import ms from 'ms';
import { SignOptions } from 'jsonwebtoken';

export type Mode = 'OnlyAccessToken' | 'Token';
type RT<T extends Mode> = T extends 'OnlyAccessToken' ? undefined : string

export type SessionId = string;
export type Scope = string | string[];
export type UserID = string;
export type Data = { [prop: string]: any };
export type Meta = { [prop: string]: any };
export type AccessToken = string;
export type RefreshToken = string;

export interface SessionRegister {
  userId?: UserID;
  scope?: Scope;
  clientId?: string;
  sessionId?: SessionId;
  // data?: Data;
  meta?: Meta;
  createdAt?: number;
  refreshAt?: number;
  [prop: string]: any;
}

export type SessionBodyFrom = StrictSessionRegister & Pick<OptionSession, 'mode' | 'accessTokenSignOptions' | 'refreshTokenSignOptions'>

type propRequired = 'sessionId' | 'userId' | 'scope';
export type StrictSessionRegister = SessionRegister;

export const msToSec = (inp: string | number) => {
  return Math.floor(ms(inp.toString() ?? '1h') / 1000);
};

export const scopeToString = (scope?: string | string[]) => {
  if (Array.isArray(scope)) return scope.join(' ');
  return scope;
};

interface OptionSession {
  readonly userId?: UserID;
  readonly scope?: Scope;
  readonly sessionId?: SessionId;
  readonly data?: Data;
  readonly meta?: Meta;
  readonly sessionControl?: SessionControl;
  readonly clientId?: string;
  readonly otherDataSession?: { [k: string]: string };
  readonly mode?: Mode;
  readonly refreshAt?: number;
  readonly createdAt?: number;
  readonly accessTokenSignOptions?: SignOptions;
  readonly refreshTokenSignOptions?: SignOptions;
}

export class Session<M extends Mode = 'Token'> implements SessionRegister {
  static from(
    { userId, scope, sessionId, data, meta, clientId, mode, refreshAt, createdAt, accessTokenSignOptions, refreshTokenSignOptions, ...otherDataSession }: SessionBodyFrom,
    sessionControl: SessionControl,
  ): Session {
    return new Session({ userId, scope, sessionId, data, meta, clientId, mode, sessionControl, otherDataSession, refreshAt, createdAt, accessTokenSignOptions, refreshTokenSignOptions });
  }

  private constructor(private readonly options?: OptionSession) { }

  readonly refreshAt = this.options?.refreshAt;
  readonly createdAt = this.options?.createdAt;
  readonly sessionControl = this.options?.sessionControl;
  readonly jwtControl = this.options?.sessionControl?.jwtControl ?? new JWTControl();
  readonly userId = this.options?.userId?.toString();
  readonly scope = scopeToString(this.options?.scope);
  readonly sessionId = this.options?.sessionId;
  readonly clientId = this.options?.clientId;
  readonly data = this.options?.data;
  readonly meta = this.options?.meta;
  readonly otherDataSession = this.options?.otherDataSession;
  readonly mode = this.options?.mode ?? 'Token';
  readonly accessTokenSignOptions = this.options?.accessTokenSignOptions;
  readonly refreshTokenSignOptions = this.options?.refreshTokenSignOptions;
  readonly accessTokenExpires = msToSec(this.accessTokenSignOptions?.expiresIn ?? this.sessionControl?.accessTokenExpires ?? '1h');
  readonly refreshTokenExpires = msToSec(this.refreshTokenSignOptions?.expiresIn ?? this.sessionControl?.refreshTokenExpires ?? '4w');

  getRegister(): SessionRegister {
    return {
      userId: this.userId,
      clientId: this.clientId,
      createdAt: this.createdAt,
      meta: this.meta,
      refreshAt: this.refreshAt,
      scope: this.scope,
      sessionId: this.sessionId,
      ...this.otherDataSession,
    }
  }

  get refreshToken() {
    if (this.mode === 'OnlyAccessToken') return undefined as RT<M>;
    return this.jwtControl.sign(
      {
        userId: this.userId,
        sessionId: this.sessionId,
        scope: this.scope,
        refreshAt: this.refreshAt,
        createdAt: this.createdAt,
        clientId: this.clientId,
      },
      {
        subject: 'refresh_token',
        ...this.refreshTokenSignOptions,
        expiresIn: this.refreshTokenExpires,
      },
    ) as RT<M>;
  }

  get accessToken() {
    return this.jwtControl.sign(
      {
        userId: this.userId,
        scope: this.scope,
        sessionId: this.sessionId,
        data: this.data,
        refreshAt: this.refreshAt,
        createdAt: this.createdAt,
        clientId: this.clientId,
      },
      {
        subject: 'access_token',
        ...this.accessTokenSignOptions,
        expiresIn: this.accessTokenExpires,
      },
    );
  }

  toJSON() {
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
      expires_in: this.accessTokenExpires,
    };
  }
}
