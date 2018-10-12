import { app } from 'electron';
import { injectable } from 'inversify';

import { TrayMenu } from './menu/tray-menu';
import { DriveUploader } from './uploader/drive-uploader';

@injectable()
export class DriveShots {
  constructor(_tray: TrayMenu, _uploader: DriveUploader) {}

  public start(): void {
    app.dock && app.dock.hide();
  }
}
