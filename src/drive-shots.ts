import { app } from 'electron';
import { inject, injectable } from 'inversify';

import Authentication from './authentication';
import iocSymbols from './ioc-symbols';
import TrayIcon from './menu/tray-icon';
import DriveUploader from './uploader/drive-uploader';
import AutoUpdater from './utils/auto-updater';

@injectable()
export default class DriveShots {
    constructor(
        @inject(iocSymbols.autoUpdater) private updater: AutoUpdater,
        @inject(iocSymbols.authentication) private auth: Authentication,
        @inject(iocSymbols.trayIcon) private tray: TrayIcon,
        @inject(iocSymbols.uploader) private uploader: DriveUploader,
    ) { }

    public start(): void {
        app.dock.hide();

        app.on('ready', () => {
            this.updater.start();
            this.tray.setup();
            // this.menu.start();
            // this.detector.start();
            this.auth.checkAuthentication();
        });
    }
}
