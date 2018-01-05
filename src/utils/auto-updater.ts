import { autoUpdater } from 'electron-updater';
import { injectable } from 'inversify';

@injectable()
export default class AutoUpdater {
    private interval: NodeJS.Timer;

    public start(): void {
        autoUpdater.checkForUpdatesAndNotify();
        this.interval = setInterval(
            () => autoUpdater.checkForUpdatesAndNotify(),
            8 * 60 * 60 * 1000, // 8 hours
        );
    }

    public stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            delete (this.interval);
        }
    }
}
