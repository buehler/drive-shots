import { app, clipboard, Menu, MenuItemConstructorOptions, NativeImage, Tray } from 'electron';
import { Drive } from 'googleapis/build/src/apis/drive/v3';
import { inject, injectable } from 'inversify';

import { Assets } from '../assets';
import { Authentication } from '../authentication';
import { JsonConfig } from '../config/json-config';
import { iocSymbols } from '../ioc-symbols';
import { DriveShotsSharedImage } from '../models/drive-shots-image';
import { AppFolderOpener } from './app-folder-opener';

const opn = require('opn');
const autoLaunch = require('auto-launch');

export const enum TrayIconState {
    Idle,
    Syncing,
    Error,
}

@injectable()
export class TrayIcon {
    private static idleIcon: NativeImage;
    private static syncIcon: NativeImage;
    private static errorIcon: NativeImage;

    public trayElement: Tray | undefined;

    public set state(value: TrayIconState) {
        switch (value) {
            case TrayIconState.Error:
                this.trayElement!.setImage(TrayIcon.errorIcon);
                break;
            case TrayIconState.Syncing:
                this.trayElement!.setImage(TrayIcon.syncIcon);
                break;
            default:
                this.trayElement!.setImage(TrayIcon.idleIcon);
                break;
        }
    }

    constructor(
        @inject(iocSymbols.assets) private readonly assets: Assets,
        @inject(iocSymbols.authentication) private readonly authentication: Authentication,
        @inject(iocSymbols.drive) private readonly drive: Drive,
        @inject(iocSymbols.config) private readonly config: JsonConfig,
        @inject(iocSymbols.appFolderOpener) private readonly opener: AppFolderOpener,
    ) {
        if (!TrayIcon.idleIcon) {
            TrayIcon.idleIcon = assets.getNativeImage('icons/tray-drive-shots.png', true);
        }
        if (!TrayIcon.syncIcon) {
            TrayIcon.syncIcon = assets.getNativeImage('icons/tray-drive-shots-syncing.png', true);
        }
        if (!TrayIcon.errorIcon) {
            TrayIcon.errorIcon = assets.getNativeImage('icons/tray-drive-shots-sync-error.png', true);
        }
    }

    public setup(): void {
        this.trayElement = new Tray(TrayIcon.idleIcon);
        this.authentication.authenticationChanged.subscribe(auth => this.buildContextMenu(auth));
    }

    public async buildContextMenu(authenticated: boolean): Promise<void> {
        let template: MenuItemConstructorOptions[] = [
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
            { label: 'Quit', click: () => { app.quit(); } },
        ];

        if (authenticated) {
            const userinfo = await this.drive.about.get({ fields: 'user,storageQuota' });
            const usage = userinfo.data.storageQuota.usage / 1024 / 1024 / 1024;

            const images = this.config.get('shared-images', [] as DriveShotsSharedImage[]);

            template = [
                {
                    label: userinfo.data.user.displayName,
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
                            click: () => this.authentication.deauthorize(),
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
                ...template,
            ];
        } else {
            template = [
                {
                    label: 'Authenticate Drive',
                    icon: this.assets.getNativeImage('images/drive.png'),
                    click: () => this.authentication.authenticate(),
                },
                ...template,
            ];
        }

        const context = Menu.buildFromTemplate(template);
        this.trayElement!.setContextMenu(context);
    }
}