import 'reflect-metadata';

import { Container } from 'inversify';
import { platform } from 'os';

import Assets from './assets';
import Authentication from './authentication';
import jsonConfig, { JsonConfig } from './config/json-config';
import ScreenshotDetector from './detectors/screenshot-detector';
import ScreenshotDetectorMacos from './detectors/screenshot-detector-macos';
import DriveShots from './drive-shots';
import drive from './google/drive';
import DriveApi from './google/drive-api';
import urlshortener from './google/urlshortener';
import UrlshortenerApi from './google/urlshortener-api';
import iocSymbols from './ioc-symbols';
import TrayIcon from './menu/tray-icon';
import DriveUploader from './uploader/drive-uploader';
import AutoUpdater from './utils/auto-updater';

const ioc = new Container();

// General bindings

ioc.bind<DriveShots>(iocSymbols.driveShots).to(DriveShots).inSingletonScope();
ioc.bind<Assets>(iocSymbols.assets).to(Assets);
ioc.bind<DriveApi>(iocSymbols.drive).toConstantValue(drive);
ioc.bind<UrlshortenerApi>(iocSymbols.urlShortener).toConstantValue(urlshortener);
ioc.bind<AutoUpdater>(iocSymbols.autoUpdater).to(AutoUpdater).inSingletonScope();
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);
ioc.bind<Authentication>(iocSymbols.authentication).to(Authentication).inSingletonScope();
ioc.bind<TrayIcon>(iocSymbols.trayIcon).to(TrayIcon).inSingletonScope();
ioc.bind<DriveUploader>(iocSymbols.uploader).to(DriveUploader).inSingletonScope();
// Logger

// Windows bindings

if (platform() === 'win32') {
    console.log('windows');
}

// OSX bindings

if (platform() === 'darwin') {
    ioc.bind<ScreenshotDetector>(iocSymbols.screenshotDetector).to(ScreenshotDetectorMacos).inSingletonScope();
}

// Linux bindings

if (platform() === 'linux') {
    console.log('linux');
}

export default ioc;
