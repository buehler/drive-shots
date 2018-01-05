import { app } from 'electron';
import { injectable } from 'inversify';

import AutoUpdater from './utils/auto-updater';

@injectable()
export default class App {
    constructor(
        private updater: AutoUpdater,
    ) { }

    public start(): void {
        console.log('start');
        /*
        authenticate, start menu / tray icon, then start detector
        */

        app.dock.hide();

        app.on('ready', async () => {
            this.updater.start();
        });
    }
}
