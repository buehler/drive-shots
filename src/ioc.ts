import 'reflect-metadata';

import { Container } from 'inversify';
import { platform } from 'os';

import App from './app';
import Assets from './assets';
import jsonConfig, { JsonConfig } from './config/json-config';
import drive, { Drive } from './google/drive';
import AutoUpdater from './utils/auto-updater';

export const iocSymbols = {
    config: Symbol('config'),
    drive: Symbol('drive'),
};

const ioc = new Container();

// General bindings

ioc.bind(App).to(App).inSingletonScope();
ioc.bind(Assets).to(Assets);
ioc.bind<Drive>(iocSymbols.drive).toConstantValue(drive);
ioc.bind(AutoUpdater).to(AutoUpdater).inSingletonScope();
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);
// Logger
// Auth
// Drive

// Windows bindings

if (platform() === 'win32') {
    console.log('windows');
}
// Screenshot Detection (in files & clipboard)
// Menu
// Tray?

// OSX bindings

if (platform() === 'darwin') {
    console.log('macos');
}
// Screenshot Detection (in files)
// Menu
// Tray?

// Linux bindings

if (platform() === 'linux') {
    console.log('linux');
}
// Screenshot Detection (in files & clipboard)
// Menu
// Tray?

export default ioc;
