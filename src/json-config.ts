const jsonConfig: JsonConfig = require('electron-json-config');

export interface JsonConfig {
    has(key: string): boolean;
    get<T>(key: string, defaultValue?: T): T;
    set<T>(key: string, value: T): void;
    delete(key: string): void;
}

export default jsonConfig;
