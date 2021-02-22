import '../engines/MemoryEngine';
import { SessionControl } from '../session/SessionControl';
import { JWTControl } from '../session/JWTControl';

const sc = new SessionControl({
  engineConnectionStore: 'Memory',
  jwtControl: new JWTControl({
    secret: 'asd',
  }),
});

sc.connectionStore.engine.deleteById;
