import { RAuthError } from '../util/Error';
import { Engine, EngineOptions } from './Engine';

declare global {
  interface EngineNames {
    '<<NO_SET>>': null;
  }
}

const engines: EngineNames = <EngineNames>{};

export class ConnectionStore {
  readonly engine: Engine;

  constructor(nameEngine: keyof EngineNames, engineOptions?: EngineOptions) {
    const engineFound = engines[nameEngine];

    if (!engineFound) { throw new RAuthError(`Your engine "${nameEngine}" not found.`); }

    this.engine = new engineFound(engineOptions);
  }

  static add(engineName: keyof EngineNames, engine: typeof Engine) {
    Object.defineProperty(engines, engineName, {
      value: engine,
      enumerable: true,
      writable: false,
    });
  }

  get deleteById() { return this.engine.deleteById.bind(this.engine); }
  get deleteByUserId() { return this.engine.deleteByUserId.bind(this.engine); }
  get update() { return this.engine.update.bind(this.engine); }
  get findById() { return this.engine.findById.bind(this.engine); }
  get findByUserId() { return this.engine.findByUserId.bind(this.engine); }
  get create() { return this.engine.create.bind(this.engine); }
}
