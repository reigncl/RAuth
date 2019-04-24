import { Schema, Document, connection } from 'mongoose';
import { SessionControl } from '../session/SessionControl';

interface SessionDoc extends Document { }

const sessionSchema = new Schema<SessionDoc>(
  {
    sessionId: { type: String, index: true },
    userId: { type: String, index: true },
    scope: { type: String },
    createdAt: { type: Date, default: Date.now },
    refreshAt: { type: Number },
  },
  {
    strict: false,
  },
);

// tslint:disable-next-line:variable-name
export const SessionModel = connection.model<SessionDoc>('Session', sessionSchema);

// ---

import '../engines/MongooseEngine';
import { ConnectionStore } from '../store/ConnectionStore';

export const sessionControl = new SessionControl({
  connectionStore: new ConnectionStore('Mongoose', {
    model: SessionModel,
  }),
});
