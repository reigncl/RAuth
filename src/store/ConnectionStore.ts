import { RAuthError } from '../util/Error';
import { Engine, EngineOptions } from './Engine';

const engines: { [nameEngine: string]: typeof Engine | undefined } = {};

export class ConnectionStore {
  private engine: Engine;

  constructor(nameEngine: string, engineOptions?: EngineOptions) {
    const engineFound = engines[nameEngine];

    if (!engineFound) { throw new RAuthError(`Your engine "${nameEngine}" not found.`); }

    this.engine = new engineFound(engineOptions);
  }

  static add(engineName: string, engine: typeof Engine) {
    engines[engineName] = engine;
  }

  get deleteById() { return this.engine.deleteById.bind(this.engine); }
  get update() { return this.engine.update.bind(this.engine); }
  get findById() { return this.engine.findById.bind(this.engine); }
  get create() { return this.engine.create.bind(this.engine); }
}
