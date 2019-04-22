import '../engines/SQLiteEngine';
import { SessionControl } from '../session/SessionControl';
import { JWTControl } from '../session/JWTControl';

const sc = new SessionControl({
  engineConnectionStore: 'SQLite',
  jwtControl: new JWTControl({
    secretOrPrivateKey: 'abc',
    secretOrPublicKey: 'abc',
  }),
});
