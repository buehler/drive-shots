import 'reflect-metadata';

import { Container } from 'inversify';
import { platform } from 'os';

import Assets from './assets';
import Authentication from './authentication';
import jsonConfig, { JsonConfig } from './config/json-config';
import DriveShots from './drive-shots';
import drive from './google/drive';
import DriveApi from './google/drive-api';
import iocSymbols from './ioc-symbols';
import TrayIcon from './menu/tray-icon';
import AutoUpdater from './utils/auto-updater';

const ioc = new Container();

// General bindings

ioc.bind<DriveShots>(iocSymbols.driveShots).to(DriveShots).inSingletonScope();
ioc.bind<Assets>(iocSymbols.assets).to(Assets);
ioc.bind<DriveApi>(iocSymbols.drive).toConstantValue(drive);
ioc.bind<AutoUpdater>(iocSymbols.autoUpdater).to(AutoUpdater).inSingletonScope();
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);
ioc.bind<Authentication>(iocSymbols.authentication).to(Authentication).inSingletonScope();
ioc.bind<TrayIcon>(iocSymbols.trayIcon).to(TrayIcon).inSingletonScope();
// Logger

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
