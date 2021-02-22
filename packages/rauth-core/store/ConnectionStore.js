"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStore = void 0;
var Error_1 = require("../util/Error");
var engines = {};
var ConnectionStore = /** @class */ (function () {
    function ConnectionStore(nameEngine, engineOptions) {
        var engineFound = engines[nameEngine];
        if (!engineFound) {
            throw new Error_1.RAuthError("Your engine \"" + nameEngine + "\" not found.");
        }
        // @ts-ignore
        this.engine = new engineFound(engineOptions);
    }
    ConnectionStore.add = function (engineName, engine) {
        Object.defineProperty(engines, engineName, {
            value: engine,
            enumerable: true,
            writable: false,
        });
    };
    Object.defineProperty(ConnectionStore.prototype, "deleteById", {
        get: function () { return this.engine.deleteById.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConnectionStore.prototype, "deleteByUserId", {
        get: function () { return this.engine.deleteByUserId.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConnectionStore.prototype, "update", {
        get: function () { return this.engine.update.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConnectionStore.prototype, "findById", {
        get: function () { return this.engine.findById.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConnectionStore.prototype, "findByUserId", {
        get: function () { return this.engine.findByUserId.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConnectionStore.prototype, "create", {
        get: function () { return this.engine.create.bind(this.engine); },
        enumerable: false,
        configurable: true
    });
    return ConnectionStore;
}());
exports.ConnectionStore = ConnectionStore;
