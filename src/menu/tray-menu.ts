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
import { DriveUploader } from '../uploader/drive-uploader';
import { AutoUpdater } from '../utils/auto-updater';
import { Logger } from '../utils/logger';
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

  private authenticated: boolean = false;
  private updateAvailable: boolean = false;

  public set state(value: TrayIconState) {
    this.logger.debug(
      `TrayMenu: set new menu icon state "${TrayIconState[value]}".`,
    );
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
    uploader: DriveUploader,
    private readonly authenticator: Authenticator,
    private readonly assets: Assets,
    private readonly drive: drive_v3.Drive,
    @inject(IocSymbols.config) private readonly config: JsonConfig,
    private readonly opener: AppFolderOpener,
    private readonly logger: Logger,
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

    authenticator.onAuthenticationChanged.subscribe((auth: boolean) => {
      this.authenticated = auth;
      this.buildContextMenu(this.authenticated, this.updateAvailable);
    });
    autoUpdater.onUpdateAvailable.subscribe((available: boolean) => {
      this.updateAvailable = available;
      this.buildContextMenu(this.authenticated, this.updateAvailable);
    });
    historyDetector.onHistoryDetected.subscribe(() =>
      this.buildContextMenu(this.authenticated, this.updateAvailable),
    );
    uploader.onStartUploading.subscribe(
      () => (this.state = TrayIconState.syncing),
    );
    uploader.onFinishedUploading.subscribe(() => {
      this.state = TrayIconState.idle;
      this.buildContextMenu(this.authenticated, this.updateAvailable);
    });
  }

  private async buildContextMenu(
    authenticated: boolean,
    updateAvailable: boolean,
  ): Promise<void> {
    this.logger.debug(
      `TrayMenu: buildContextMenu(${authenticated}, ${updateAvailable}).`,
    );
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
            this.logger.debug(
              `TrayMenu: change autostart setting to "${!enabled}".`,
            );
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
        {
          type: 'submenu',
          label: 'Log Level',
          submenu: [
            {
              type: 'radio',
              label: 'Debug',
              checked: this.logger.level === 'debug',
              click: () => (this.logger.level = 'debug'),
            },
            {
              type: 'radio',
              label: 'Info',
              checked: this.logger.level === 'info',
              click: () => (this.logger.level = 'info'),
            },
            {
              type: 'radio',
              label: 'Warning',
              checked: this.logger.level === 'warn',
              click: () => (this.logger.level = 'warn'),
            },
            {
              type: 'radio',
              label: 'Error',
              checked: this.logger.level === 'error',
              click: () => (this.logger.level = 'error'),
            },
          ],
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
            this.logger.debug(`TrayMenu: open item in history.`);
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
            this.logger.debug(`TrayMenu: update and restart the app.`);
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
