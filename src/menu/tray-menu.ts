import { app, clipboard, Menu, MenuItemConstructorOptions, NativeImage, Tray } from 'electron';
import { drive_v3 } from 'googleapis';
import { inject, injectable } from 'inversify';

import { Assets } from '../assets';
import { Authenticator } from '../authentication/google-auth';
import { JsonConfig } from '../config/json-config';
import { iocSymbols } from '../ioc-symbols';
import { DriveShotsSharedImage } from '../models/drive-shots-image';
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
    private readonly authenticator: Authenticator,
    private readonly assets: Assets,
    private readonly drive: drive_v3.Drive,
    @inject(iocSymbols.config) private readonly config: JsonConfig,
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

    authenticator.onAuthenticationChanged.subscribe(auth =>
      this.buildContextMenu(auth),
    );
  }

  // TODO: authenticated combine with on update available
  private async buildContextMenu(authenticated: boolean): Promise<void> {
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
        {
          label: 'Quit',
          click: () => {
            app.quit();
          },
        },
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
}
