import { Menu, MenuItemConstructorOptions, NativeImage, Tray } from 'electron';

import Assets from './assets';

export const enum TrayIconState {
    Idle,
    Syncing,
    Error,
}

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

    constructor(template: MenuItemConstructorOptions[]) {
        if (!TrayIcon.idleIcon) {
            TrayIcon.idleIcon = Assets.getNativeImage('icons/tray-drive-shots.png', true);
        }
        if (!TrayIcon.syncIcon) {
            TrayIcon.syncIcon = Assets.getNativeImage('icons/tray-drive-shots-syncing.png', true);
        }
        if (!TrayIcon.errorIcon) {
            TrayIcon.errorIcon = Assets.getNativeImage('icons/tray-drive-shots-sync-error.png', true);
        }
        this.trayElement = new Tray(TrayIcon.idleIcon);
        const context = Menu.buildFromTemplate(template);
        this.trayElement.setContextMenu(context);
    }
}
