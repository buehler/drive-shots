import { app } from 'electron';
import { injectable } from 'inversify';

import { TrayMenu } from './menu/tray-menu';

@injectable()
export class DriveShots {
  constructor(_tray: TrayMenu) {}

  public start(): void {
    app.dock && app.dock.hide();
  }
}
