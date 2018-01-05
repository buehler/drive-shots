import { autoUpdater } from 'electron-updater';
import { injectable } from 'inversify';

@injectable()
export default class AutoUpdater {
    private interval: NodeJS.Timer;

    public start(): void {
        autoUpdater.checkForUpdatesAndNotify();
        this.interval = setInterval(
            () => autoUpdater.checkForUpdatesAndNotify(),
            3 * 60 * 60 * 1000, // 3 hours
        );
    }

    public stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            delete (this.interval);
        }
    }
}
