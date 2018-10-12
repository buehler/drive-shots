import { drive_v3, google } from 'googleapis';
import { Container } from 'inversify';

import { Assets } from './assets';
import { Authenticator } from './authentication/google-auth';
import { JsonConfig, jsonConfig } from './config/json-config';
import { DriveShots } from './drive-shots';
import { HistoryDetector } from './history/history-detector';
import { iocSymbols } from './ioc-symbols';
import { AppFolderOpener } from './menu/app-folder-opener';
import { TrayMenu } from './menu/tray-menu';

const ioc = new Container();

ioc.bind(DriveShots).to(DriveShots);
ioc.bind(TrayMenu).to(TrayMenu);
ioc.bind(Assets).to(Assets);
ioc.bind(Authenticator).to(Authenticator);
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);
ioc.bind(drive_v3.Drive).toConstantValue(google.drive('v3'));
ioc.bind(AppFolderOpener).to(AppFolderOpener);
ioc.bind(HistoryDetector).to(HistoryDetector);

export const container = ioc;
