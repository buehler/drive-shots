import { app } from 'electron';
import { inject, injectable } from 'inversify';

import { Authentication } from './authentication';
import { ScreenshotDetector } from './detectors/screenshot-detector';
import { HistoryDetector } from './history/history-detector';
import { iocSymbols } from './ioc-symbols';
import { TrayIcon } from './menu/tray-icon';
import { DriveUploader } from './uploader/drive-uploader';
import { AutoUpdater } from './utils/auto-updater';

@injectable()
export class DriveShots {
    constructor(
        @inject(iocSymbols.autoUpdater) private updater: AutoUpdater,
        @inject(iocSymbols.authentication) private auth: Authentication,
        @inject(iocSymbols.trayIcon) private tray: TrayIcon,
        @inject(iocSymbols.screenshotDetector) private detector: ScreenshotDetector,
        @inject(iocSymbols.uploader) private uploader: DriveUploader,
        @inject(iocSymbols.historyDetector) private historyDetector: HistoryDetector,
    ) { }

    public start(): void {
        app.dock && app.dock.hide();

        this.updater.start();
        this.historyDetector.setup();
        this.tray.setup();
        this.detector.setup();
        this.uploader.setup();
        this.auth.checkAuthentication();
    }
}
