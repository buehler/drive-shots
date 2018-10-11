import { NativeImage, Tray } from 'electron';
import { injectable } from 'inversify';

import { Assets } from '../assets';

@injectable()
export class TrayMenu {
  public trayElement: Tray;

  private idleIcon: NativeImage;
  private syncIcon: NativeImage;
  private errorIcon: NativeImage;

  constructor(assets: Assets) {
    this.idleIcon = assets.getNativeImage('icons/tray-drive-shots.png', true);
    this.syncIcon = assets.getNativeImage(
      'icons/tray-drive-shots-syncing.png',
      true,
    );
    this.errorIcon = assets.getNativeImage(
      'icons/tray-drive-shots-sync-error.png',
      true,
    );
    this.trayElement = new Tray(this.idleIcon);
  }
}
