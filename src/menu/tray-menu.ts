import {
  app,
  clipboard,
  Menu,
  MenuItemConstructorOptions,
  NativeImage,
  Tray,
} from 'electron';
import { drive_v3 } from 'googleapis';
import { inject, injectable } from 'inversify';
import { combineLatest } from 'rxjs';

import { Assets } from '../assets';
import { Authenticator } from '../authentication/google-auth';
import { JsonConfig } from '../config/json-config';
import { HistoryDetector } from '../history/history-detector';
import { IocSymbols } from '../ioc-symbols';
import { DriveShotsSharedImage } from '../models/drive-shots-image';
import { AutoUpdater } from '../utils/auto-updater';
import { AppFolderOpener } from './app-folder-opener';
import { TrayIconState } from './tray-icon-state';

const opn = require('opn');
const autoLaunch = require('auto-launch');

@injectable()
export class TrayMenu {
  public trayElement: Tray;

  private idleIcon: NativeImage;
  private syncIcon: NativeImage;
  private errorIcon: NativeImage;

  public set state(value: TrayIconState) {
    switch (value) {
      case TrayIconState.error:
        this.trayElement.setImage(this.errorIcon);
        break;
      case TrayIconState.syncing:
        this.trayElement.setImage(this.syncIcon);
        break;
      default:
        this.trayElement.setImage(this.idleIcon);
        break;
    }
  }

  constructor(
    historyDetector: HistoryDetector,
    autoUpdater: AutoUpdater,
    private readonly authenticator: Authenticator,
    private readonly assets: Assets,
    private readonly drive: drive_v3.Drive,
    @inject(IocSymbols.config) private readonly config: JsonConfig,
    private readonly opener: AppFolderOpener,
  ) {
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

    combineLatest(
      authenticator.onAuthenticationChanged,
      autoUpdater.onUpdateAvailable,
      historyDetector.onHistoryDetected,
    ).subscribe(([auth, upd]) => this.buildContextMenu(auth, upd));
  }

  private async buildContextMenu(
    authenticated: boolean,
    updateAvailable: boolean,
  ): Promise<void> {
    this.trayElement.setContextMenu(
      Menu.buildFromTemplate([
        ...(await this.authenticatedTemplate(authenticated)),
        { type: 'separator' },
        {
          label: 'Autostart app on login',
          type: 'checkbox',
          checked: this.config.get('autostart.enabled', false),
          click: async () => {
            const enabled = this.config.get('autostart.enabled', false);
            this.config.set('autostart.enabled', !enabled);
            const autoLauncher = new autoLaunch({ name: 'Drive Shots' });
            const isEnabled = await autoLauncher.isEnabled();
            if (!isEnabled && !enabled) {
              autoLauncher.enable();
            }
            if (isEnabled && enabled) {
              autoLauncher.disable();
            }
          },
        },
        { type: 'separator' },
        ...this.updateAvailableTemplate(updateAvailable),
      ]),
    );
  }

  private async authenticatedTemplate(
    authenticated: boolean,
  ): Promise<MenuItemConstructorOptions[]> {
    if (!authenticated) {
      return [
        {
          label: 'Authenticate Drive',
          icon: this.assets.getNativeImage('images/drive.png'),
          click: () => this.authenticator.authenticate(),
        },
      ];
    }

    const userinfo = await this.drive.about.get({
      fields: 'user,storageQuota',
    } as any);
    const usage = userinfo.data.storageQuota.usage / 1024 / 1024 / 1024;
    const images = this.config.get(
      'shared-images',
      [] as DriveShotsSharedImage[],
    );

    return [
      {
        label: userinfo.data.user!.displayName,
        icon: this.assets.getNativeImage('images/drive.png'),
        type: 'submenu',
        submenu: [
          {
            label: `usage: ${Math.round(usage * 100) / 100} GB`,
            enabled: false,
          },
          { type: 'separator' },
          {
            label: 'Deauthorize',
            click: () => this.authenticator.deauthorize(),
          },
        ],
      },
      {
        label: 'History',
        type: 'submenu',
        submenu: images.map(image => ({
          label: image.name,
          click: () => {
            opn(image.url);
            clipboard.writeText(image.url);
          },
        })),
      },
      { type: 'separator' },
      {
        label: 'Open folder in browser',
        type: 'normal',
        click: () => this.opener.openAppFolder(),
      },
    ];
  }

  private updateAvailableTemplate(
    updateAvailable: boolean,
  ): MenuItemConstructorOptions[] {
    if (updateAvailable) {
      return [
        {
          label: 'Update and Restart',
          click: () => {
            app.relaunch();
            app.quit();
          },
        },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          },
        },
      ];
    }
    return [
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ];
  }
}
