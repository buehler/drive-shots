import 'reflect-metadata';

import { google } from 'googleapis';
import { Drive } from 'googleapis/build/src/apis/drive/v3';
import { Container } from 'inversify';
import { platform } from 'os';

import { Assets } from './assets';
import { Authentication } from './authentication';
import { JsonConfig, jsonConfig } from './config/json-config';
import { ScreenshotDetector } from './detectors/screenshot-detector';
import { ScreenshotDetectorLinux } from './detectors/screenshot-detector-linux';
import { ScreenshotDetectorMacos } from './detectors/screenshot-detector-macos';
import { ScreenshotDetectorWin } from './detectors/screenshot-detector-win';
import { DriveShots } from './drive-shots';
import { HistoryDetector } from './history/history-detector';
import { iocSymbols } from './ioc-symbols';
import { AppFolderOpener } from './menu/app-folder-opener';
import { TrayIcon } from './menu/tray-icon';
import { DriveUploader } from './uploader/drive-uploader';
import { AutoUpdater } from './utils/auto-updater';

const ioc = new Container();

// General bindings

ioc.bind<DriveShots>(iocSymbols.driveShots).to(DriveShots).inSingletonScope();
ioc.bind<Assets>(iocSymbols.assets).to(Assets);
ioc.bind<Drive>(iocSymbols.drive).toConstantValue(google.drive('v3'));
ioc.bind<AutoUpdater>(iocSymbols.autoUpdater).to(AutoUpdater).inSingletonScope();
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);
ioc.bind<Authentication>(iocSymbols.authentication).to(Authentication).inSingletonScope();
ioc.bind<TrayIcon>(iocSymbols.trayIcon).to(TrayIcon).inSingletonScope();
ioc.bind<DriveUploader>(iocSymbols.uploader).to(DriveUploader).inSingletonScope();
ioc.bind<HistoryDetector>(iocSymbols.historyDetector).to(HistoryDetector).inSingletonScope();
ioc.bind<AppFolderOpener>(iocSymbols.appFolderOpener).to(AppFolderOpener).inSingletonScope();

// Logger

// Windows bindings

if (platform() === 'win32') {
    ioc.bind<ScreenshotDetector>(iocSymbols.screenshotDetector).to(ScreenshotDetectorWin).inSingletonScope();
}

// OSX bindings

if (platform() === 'darwin') {
    ioc.bind<ScreenshotDetector>(iocSymbols.screenshotDetector).to(ScreenshotDetectorMacos).inSingletonScope();
}

// Linux bindings

if (platform() === 'linux') {
    ioc.bind<ScreenshotDetector>(iocSymbols.screenshotDetector).to(ScreenshotDetectorLinux).inSingletonScope();
}

export { ioc };
