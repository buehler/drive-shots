import { FSWatcher, watch } from 'chokidar';
import { app, clipboard, Notification } from 'electron';
import { unlinkSync } from 'fs';

import { getDriveAppFolder, shareDriveFile, uploadFileToFolder } from './drive';
import { DriveShotsSharedImage } from './drive-shots-image';
import jsonConfig from './json-config';
import TrayIcon, { TrayIconState } from './tray-icon';

const opn = require('opn');
const WATCH_PATH = `${app.getPath('home')}/Desktop/Screen Shot*.png`;

export default class Watcher {
    private watcher: FSWatcher;
    private folderId: string;

    constructor(
        private readonly icon: TrayIcon,
    ) { }

    public async start(): Promise<void> {
        this.folderId = await getDriveAppFolder();
        this.watcher = watch(WATCH_PATH);
        this.watcher.on('ready', () => {
            this.icon.state = TrayIconState.Idle;
        });
        this.watcher.on('add', path => this.uploadImage(path));
    }

    public stop(): void {
        this.watcher.close();
    }

    private async uploadImage(path: string): Promise<void> {
        this.icon.state = TrayIconState.Syncing;
        const file = await uploadFileToFolder(this.folderId, path);
        const sharedImage = await shareDriveFile(file);
        this.icon.state = TrayIconState.Idle;

        const images = jsonConfig.get('shared-images', [] as DriveShotsSharedImage[]);
        images.unshift(sharedImage);
        jsonConfig.set('shared-images', images);

        clipboard.writeText(sharedImage.url);
        unlinkSync(path);

        const notification = new Notification({
            title: 'Screenshot uploaded',
            body: 'The URL has been copied to your clipboard',
        });
        notification.on('click', () => opn(sharedImage.url));
        notification.show();
    }
}
