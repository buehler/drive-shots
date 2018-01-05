import { randomBytes } from 'crypto';
import { clipboard, Notification } from 'electron';
import { createReadStream, unlinkSync } from 'fs';
import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import { parse } from 'path';
import { Observable } from 'rxjs';

import Authentication from '../authentication';
import { JsonConfig } from '../config/json-config';
import ScreenshotDetector from '../detectors/screenshot-detector';
import DriveApi from '../google/drive-api';
import UrlshortenerApi from '../google/urlshortener-api';
import iocSymbols from '../ioc-symbols';
import TrayIcon, { TrayIconState } from '../menu/tray-icon';
import { DriveShotsImage, DriveShotsSharedImage } from '../models/drive-shots-image';

const mime = require('mime');
const opn = require('opn');

@injectable()
export default class DriveUploader {
    private folderId: string;

    constructor(
        @inject(iocSymbols.authentication) private readonly auth: Authentication,
        @inject(iocSymbols.drive) private readonly drive: DriveApi,
        @inject(iocSymbols.urlShortener) private readonly urlShortener: UrlshortenerApi,
        @inject(iocSymbols.screenshotDetector) private readonly detector: ScreenshotDetector,
        @inject(iocSymbols.trayIcon) private readonly icon: TrayIcon,
        @inject(iocSymbols.config) private readonly config: JsonConfig,
    ) { }

    public setup(): void {
        Observable.combineLatest(
            this.auth.authenticationChanged,
            this.detector.screenshotDetected,
        ).subscribe(data => this.upload(data));
    }

    private async upload([authenticated, path]: [boolean, string]): Promise<void> {
        if (!authenticated) {
            delete this.folderId;
            return;
        }
        if (!this.folderId) {
            const body = await this.drive.files.list(
                {
                    q: `mimeType = 'application/vnd.google-apps.folder' and ` +
                        `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
                    fields: 'files(id)',
                },
            );

            if (body.files.length <= 0) {
                const folder = await this.drive.files.create(
                    {
                        resource: {
                            name: 'DriveShots',
                            mimeType: 'application/vnd.google-apps.folder',
                            appProperties: {
                                'drive-shots': 'drive-shots-folder',
                            },
                        },
                        fields: 'id',
                    },
                );
                this.folderId = folder.id;
            } else {
                this.folderId = body.files[0].id;
            }
        }

        this.icon.state = TrayIconState.Syncing;
        const image = await this.uploadToFolder(path);
        const sharedImage = await this.shareFile(image);
        this.icon.state = TrayIconState.Idle;

        const images = this.config.get('shared-images', [] as DriveShotsSharedImage[]);
        images.unshift(sharedImage);
        this.config.set('shared-images', images);

        clipboard.writeText(sharedImage.url);
        unlinkSync(path);

        const notification = new Notification({
            title: 'Screenshot uploaded',
            body: 'The URL has been copied to your clipboard',
        });
        notification.on('click', () => opn(sharedImage.url));
        notification.show();
    }

    private async uploadToFolder(path: string): Promise<DriveShotsImage> {
        const resource = {
            name: `${moment().format('YYYY-MM-DDTHH:mm:ss')}-${randomBytes(4).toString('hex')}${parse(path).ext}`,
            appProperties: {
                'drive-shots': 'drive-shots-image',
            },
            parents: [this.folderId],
        };
        const media = {
            mimeType: mime.getType(path),
            body: createReadStream(path),
        };

        const file = await this.drive.files.create({
            resource,
            media,
            fields: 'id',
        });

        return {
            name: resource.name,
            id: file.id,
        };
    }

    private async shareFile(image: DriveShotsImage): Promise<DriveShotsSharedImage> {
        await this.drive.permissions.create(
            {
                fileId: image.id,
                resource: {
                    type: 'anyone',
                    role: 'reader',
                    allowFileDiscovery: false,
                },
            },
        );
        const file = await this.drive.files.get(
            {
                fileId: image.id,
                fields: 'id,name,webViewLink',
            },
        );
        const short = await this.urlShortener.url.insert(
            {
                resource: {
                    longUrl: file.webViewLink,
                },
            },
        );
        return {
            ...image,
            url: short.id,
        };
    }
}
