import ow from 'ow';
import { SessionControl } from './SessionControl';
import { JWTControl } from './JWTControl';
import ms from 'ms';

export type SessionId = string;
export type Scope = string | string[];
export type UserID = string;
export type Data = { [prop: string]: any };
export type AccessToken = string;
export type RefreshToken = string;

export interface SessionRegister {
  userId?: UserID;
  scope?: Scope;
  sessionId?: SessionId;
  data?: Data;

  iat?: number;
  exp?: number;
  [pro: string]: any;
}

type propRequired = 'sessionId' | 'userId' | 'scope';
export type StrictSessionRegister = Required<Pick<SessionRegister, propRequired>> & SessionRegister;

export const msToSec = (inp: string | number) => {
  return Math.floor(ms(inp.toString() ?? '1h') / 1000);
};

export class Session implements SessionRegister {
  static from(
    { userId, scope, sessionId, data, ...otherDataSession }: StrictSessionRegister,
    sessionControl: SessionControl,
  ): Session {
    ow(userId, 'userId', ow.string);
    ow(sessionId, 'sessionId', ow.string);

    return Object.assign(
      new Session({ userId, scope, sessionId, data, sessionControl }),
      otherDataSession,
    );
  }

  readonly refreshAt?: number;
  readonly createdAt?: number;

  readonly iat?: number;
  readonly exp?: number;

  constructor(private readonly options?: {
    readonly userId?: UserID,
    readonly scope?: Scope,
    readonly sessionId?: SessionId,
    readonly data?: Data,
    readonly sessionControl?: SessionControl,
  }) { }

  readonly sessionControl = this.options?.sessionControl;
  readonly jwtControl = this.options?.sessionControl?.jwtControl ?? new JWTControl();
  readonly userId = this.options?.userId;
  readonly scope = this.options?.scope;
  readonly sessionId = this.options?.sessionId;
  readonly data = this.options?.data;

  readonly accessTokenExpires = msToSec(this.sessionControl?.accessTokenExpires ?? '1h');
  readonly refreshTokenExpires = msToSec(this.sessionControl?.refreshTokenExpires ?? '4w');

  get refreshToken() {
    return this.jwtControl.sign(
      {
        userId: this.userId,
        sessionId: this.sessionId,
        scope: this.scope,
        refreshAt: this.refreshAt,
        createdAt: this.createdAt,
      },
      {
        subject: 'refresh_token',
        expiresIn: this.refreshTokenExpires,
      },
    );
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
      },
      {
        subject: 'access_token',
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
