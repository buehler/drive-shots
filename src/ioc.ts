import { Container } from 'inversify';

import { Assets } from './assets';
import { Authenticator } from './authentication/google-auth';
import { JsonConfig, jsonConfig } from './config/json-config';
import { DriveShots } from './drive-shots';
import { iocSymbols } from './ioc-symbols';
import { TrayMenu } from './menu/tray-menu';

const ioc = new Container();

ioc.bind(DriveShots).to(DriveShots);
ioc.bind(TrayMenu).to(TrayMenu);
ioc.bind(Assets).to(Assets);
ioc.bind(Authenticator).to(Authenticator);
ioc.bind<JsonConfig>(iocSymbols.config).toConstantValue(jsonConfig);

export const container = ioc;
