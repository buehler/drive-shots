import { autoUpdater } from 'electron-updater';
import { injectable } from 'inversify';

@injectable()
export class AutoUpdater {
    private interval: NodeJS.Timer | undefined;

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
