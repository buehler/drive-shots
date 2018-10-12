import { drive_v3, google } from 'googleapis';
import { Container } from 'inversify';
import { platform } from 'os';

import { Assets } from './assets';
import { Authenticator } from './authentication/google-auth';
import { JsonConfig, jsonConfig } from './config/json-config';
import { ScreenshotDetector } from './detectors/screenshot-detector';
import { ScreenshotDetectorLinux } from './detectors/screenshot-detector-linux';
import { ScreenshotDetectorMacos } from './detectors/screenshot-detector-macos';
import { ScreenshotDetectorWin } from './detectors/screenshot-detector-win';
import { DriveShots } from './drive-shots';
import { HistoryDetector } from './history/history-detector';
import { IocSymbols } from './ioc-symbols';
import { AppFolderOpener } from './menu/app-folder-opener';
import { TrayMenu } from './menu/tray-menu';
import { UrlShortener } from './url-shortener/smrtv-shortener';
import { AutoUpdater } from './utils/auto-updater';

const ioc = new Container();

ioc.bind(AppFolderOpener).to(AppFolderOpener);
ioc.bind(Assets).to(Assets);
ioc.bind(Authenticator).to(Authenticator);
ioc.bind(AutoUpdater).to(AutoUpdater);
ioc.bind(drive_v3.Drive).toConstantValue(google.drive('v3'));
ioc.bind(DriveShots).to(DriveShots);
ioc.bind(HistoryDetector).to(HistoryDetector);
ioc.bind<JsonConfig>(IocSymbols.config).toConstantValue(jsonConfig);
ioc.bind(TrayMenu).to(TrayMenu);
ioc.bind(UrlShortener).to(UrlShortener);

// Windows bindings

if (platform() === 'win32') {
  ioc
    .bind<ScreenshotDetector>(IocSymbols.screenshotDetector)
    .to(ScreenshotDetectorWin)
    .inSingletonScope();
}

// OSX bindings

if (platform() === 'darwin') {
  ioc
    .bind<ScreenshotDetector>(IocSymbols.screenshotDetector)
    .to(ScreenshotDetectorMacos)
    .inSingletonScope();
}

// Linux bindings

if (platform() === 'linux') {
  ioc
    .bind<ScreenshotDetector>(IocSymbols.screenshotDetector)
    .to(ScreenshotDetectorLinux)
    .inSingletonScope();
}

export const container = ioc;
