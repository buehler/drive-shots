import { app, Menu, MenuItemConstructorOptions, NativeImage, Tray } from 'electron';
import { inject, injectable } from 'inversify';

import Assets from '../assets';
import Authentication from '../authentication';
import DriveApi from '../google/drive-api';
import iocSymbols from '../ioc-symbols';

export const enum TrayIconState {
    Idle,
    Syncing,
    Error,
}

@injectable()
export default class TrayIcon {
    private static idleIcon: NativeImage;
    private static syncIcon: NativeImage;
    private static errorIcon: NativeImage;

    public trayElement: Tray;

    public set state(value: TrayIconState) {
        switch (value) {
            case TrayIconState.Error:
                this.trayElement.setImage(TrayIcon.errorIcon);
                break;
            case TrayIconState.Syncing:
                this.trayElement.setImage(TrayIcon.syncIcon);
                break;
            default:
                this.trayElement.setImage(TrayIcon.idleIcon);
                break;
        }
    }

    constructor(
        @inject(iocSymbols.assets) private readonly assets: Assets,
        @inject(iocSymbols.authentication) private readonly authentication: Authentication,
        @inject(iocSymbols.drive) private readonly drive: DriveApi,
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

    private async buildContextMenu(authenticated: boolean): Promise<void> {
        const template: MenuItemConstructorOptions[] = [
            { type: 'separator' },
            { label: 'Quit', click: () => { app.quit(); } },
        ];

        if (authenticated) {
            const userinfo = await this.drive.about.get({ fields: 'user,storageQuota' });
            const usage = userinfo.storageQuota.usage / 1024 / 1024 / 1024;
            template.unshift({
                label: userinfo.user.displayName,
                icon: this.assets.getNativeImage('images/drive.png'),
                type: 'submenu',
                submenu: [
                    {
                        label: `usage: ${usage} GB`,
                        enabled: false,
                    },
                    { type: 'separator' },
                    {
                        label: 'Deauthorize',
                        click: () => this.authentication.deauthorize(),
                    },
                ],
            });
        } else {
            template.unshift({
                label: 'Authenticate Drive',
                icon: this.assets.getNativeImage('images/drive.png'),
                click: () => this.authentication.authenticate(),
            });
        }

        const context = Menu.buildFromTemplate(template);
        this.trayElement.setContextMenu(context);
    }
}
