import { UserID, Scope, SessionId, Meta, Mode } from '../global-types';
export interface Register {
    readonly userId?: UserID;
    readonly scope?: Scope;
    readonly sessionId?: SessionId;
    readonly meta?: Meta;
    readonly clientId?: string;
    readonly mode?: Mode;
    readonly tokenType?: string;
    readonly refreshAt?: number;
    readonly createdAt?: number;
}
