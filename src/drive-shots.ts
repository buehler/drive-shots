import { app } from 'electron';
import { injectable } from 'inversify';

import { TrayMenu } from './menu/tray-menu';
import { Logger } from './utils/logger';

@injectable()
export class DriveShots {
  constructor(_tray: TrayMenu, private readonly logger: Logger) {}

  public start(): void {
    app.dock && app.dock.hide();
    this.logger.info(`DriveShots: Started up an ready.`);
  }
}
