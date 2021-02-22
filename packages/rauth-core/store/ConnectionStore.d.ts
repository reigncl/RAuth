import { Engine, EngineOptions } from './Engine';
declare global {
    interface EngineNames {
        '<<NO_SET>>': null;
    }
}
export declare class ConnectionStore {
    readonly engine: Engine;
    constructor(nameEngine: keyof EngineNames, engineOptions?: EngineOptions);
    static add(engineName: keyof EngineNames, engine: typeof Engine): void;
    get deleteById(): (sessionId: string) => Promise<boolean>;
    get deleteByUserId(): (userId: string) => Promise<boolean>;
    get update(): (register: import("./Register").Register, sets: any) => Promise<import("./Register").Register>;
    get findById(): (sessionId: string) => Promise<import("./Register").Register>;
    get findByUserId(): (userId: string) => Promise<import("./Register").Register[]>;
    get create(): (sessionRegister: import("./Register").Register) => Promise<import("./Register").Register>;
}
