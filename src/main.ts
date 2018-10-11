import 'reflect-metadata';

import { Container } from 'inversify';

import { Assets } from './assets';
import { DriveShots } from './drive-shots';
import { TrayMenu } from './menu/tray-menu';

function configureIoc(): Container {
  const ioc = new Container();

  ioc.bind(DriveShots).to(DriveShots);
  ioc.bind(TrayMenu).to(TrayMenu);
  ioc.bind(Assets).to(Assets);

  return ioc;
}

export function startup(): void {
  const ioc = configureIoc();
  ioc.get(DriveShots).start();
}
