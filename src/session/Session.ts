import ow from 'ow';
import { SessionControl } from './SessionControl';
import { JWTControl } from './JWTControl';

export type SessionId = string;
export type Scope = string | string[];
export type UserID = string;
export type Data = object;
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

export class Session implements SessionRegister {
  static from(
    { userId, scope, sessionId, data, ...otherDataSession }: StrictSessionRegister,
    sessionControl: SessionControl,
  ): Session {
    ow(userId, 'userId', ow.string);
    ow(sessionId, 'sessionId', ow.string);

    return Object.assign(
      new Session(userId, scope, sessionId, data, sessionControl),
      otherDataSession,
    );
  }

  readonly refreshAt?: number;

  readonly iat?: number;
  readonly exp?: number;
  readonly jwtControl: JWTControl;

  constructor(
    readonly userId: UserID,
    readonly scope: Scope,
    readonly sessionId: SessionId,
    readonly data?: Data,
    sessionControl?: SessionControl,
  ) {
    this.jwtControl = (sessionControl && sessionControl.jwtControl) || new JWTControl();
  }

  get refreshToken() {
    return this.jwtControl.sign(
      {
        userId: this.userId,
        sessionId: this.sessionId,
        scope: this.scope,
        data: this.data,
        refreshAt: this.refreshAt,
      },
      {
        subject: 'refresh_token',
        expiresIn: '4w',
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
      },
      {
        expiresIn: '1h',
      },
    );
  }

  toJSON() {
    return {
      access_token: this.accessToken,
      refresh_token: this.refreshToken,
    };
  }
}
