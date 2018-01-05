import { app } from 'electron';
import { inject, injectable } from 'inversify';

import Authentication from './authentication';
import iocSymbols from './ioc-symbols';
import TrayIcon from './menu/tray-icon';
import AutoUpdater from './utils/auto-updater';

@injectable()
export default class DriveShots {
    constructor(
        @inject(iocSymbols.autoUpdater) private updater: AutoUpdater,
        @inject(iocSymbols.authentication) private auth: Authentication,
        @inject(iocSymbols.trayIcon) private tray: TrayIcon, // for now
    ) { }

    public start(): void {
        console.log('start');
        /*
        authenticate, start menu / tray icon, then start detector
        */

        app.dock.hide();

        app.on('ready', () => {
            this.updater.start();
            this.tray.setup();
            // this.menu.start();
            // this.detector.start();
            this.auth.checkAuthentication();
        });

        app.on('quit', () => {
            this.updater.stop();
        });
    }
}
