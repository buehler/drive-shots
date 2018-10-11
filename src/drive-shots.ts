import { app } from 'electron';
import { injectable } from 'inversify';

import { TrayMenu } from './menu/tray-menu';

@injectable()
export class DriveShots {
  constructor(private tray: TrayMenu) {}

  public start(): void {
    app.dock && app.dock.hide();
    console.log(this.tray);
  }
}
