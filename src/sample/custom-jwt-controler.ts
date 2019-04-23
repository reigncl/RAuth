import '../engines/MemoryEngine';
import { SessionControl } from '../session/SessionControl';
import { JWTControl } from '../session/JWTControl';

const sc = new SessionControl({
  engineConnectionStore: 'Memory',
  jwtControl: new JWTControl({
    algorithm: 'HS256',
    secret: 'asd',
  }),
});

sc.connectionStore.engine.deleteById;
