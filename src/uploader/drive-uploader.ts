// import { randomBytes } from 'crypto';
// import { clipboard } from 'electron';
// import { existsSync, unlinkSync } from 'fs';
// import { Drive } from 'googleapis/build/src/apis/drive/v3';
// import { inject, injectable } from 'inversify';
// import * as moment from 'moment';
// import { notify } from 'node-notifier';
// import { join, parse } from 'path';
// import { Observable } from 'rxjs';
// import { Duplex } from 'stream';

// import { Authentication } from '../authentication';
// import { JsonConfig } from '../config/json-config';
// import { Screenshot } from '../detectors/Screenshot';
// import { ScreenshotDetector } from '../detectors/screenshot-detector';
// import { iocSymbols } from '../ioc-symbols';
// import { TrayIcon, TrayIconState } from '../menu/tray-icon';
// import { DriveShotsImage, DriveShotsSharedImage } from '../models/drive-shots-image';

// const mime = require('mime');
// const opn = require('opn');

// @injectable()
// export class DriveUploader {
//     private folderId: string = '';

//     constructor(
//         @inject(iocSymbols.authentication) private readonly auth: Authentication,
//         @inject(iocSymbols.drive) private readonly drive: Drive,
//         @inject(iocSymbols.screenshotDetector) private readonly detector: ScreenshotDetector,
//         @inject(iocSymbols.trayIcon) private readonly icon: TrayIcon,
//         @inject(iocSymbols.config) private readonly config: JsonConfig,
//     ) { }

//     public setup(): void {
//         Observable.combineLatest(
//             this.auth.authenticationChanged,
//             this.detector.screenshotDetected,
//         ).subscribe(data => this.upload(data));
//     }

//     private async upload([authenticated, screenshot]: [boolean, Screenshot]): Promise<void> {
//         if (!authenticated) {
//             delete this.folderId;
//             return;
//         }
//         if (!this.folderId) {
//             const body = await this.drive.files.list(
//                 {
//                     q: `mimeType = 'application/vnd.google-apps.folder' and ` +
//                         `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
//                     fields: 'files(id)',
//                 },
//             );

//             if (body.data.files.length <= 0) {
//                 const folder = await this.drive.files.create(
//                     {
//                         resource: {
//                             name: 'DriveShots',
//                             mimeType: 'application/vnd.google-apps.folder',
//                             appProperties: {
//                                 'drive-shots': 'drive-shots-folder',
//                             },
//                         },
//                         fields: 'id',
//                     },
//                 );
//                 this.folderId = folder.data.id;
//             } else {
//                 this.folderId = body.data.files[0].id;
//             }
//         }

//         this.icon.state = TrayIconState.Syncing;
//         const image = await this.uploadToFolder(screenshot);
//         const sharedImage = await this.shareFile(image);
//         this.icon.state = TrayIconState.Idle;

//         const images = this.config.get('shared-images', [] as DriveShotsSharedImage[]);
//         images.unshift(sharedImage);
//         this.config.set('shared-images', images.slice(0, 10));

//         clipboard.writeText(sharedImage.url);

//         if (existsSync(screenshot.path)) {
//             unlinkSync(screenshot.path);
//         }

//         notify(
//             {
//                 message: 'The URL has been copied to your clipboard.',
//                 title: 'Screenshot uploaded',
//                 icon: join(__dirname, '..', 'assets', 'images', 'icon.png'),
//                 wait: true,
//             },
//             (_err, response) => {
//                 // "activate" -> mac
//                 if (response.indexOf('clicked') >= 0 || response.indexOf('activate') >= 0) {
//                     opn(sharedImage.url);
//                 }
//             },
//         );

//         this.icon.buildContextMenu(authenticated);
//     }

//     private async uploadToFolder(screenshot: Screenshot): Promise<DriveShotsImage> {
//         const resource = {
//             name: `${moment().format('YYYY-MM-DDTHH-mm-ss')}_${randomBytes(4).toString('hex')}${parse(screenshot.path).ext}`,
//             appProperties: {
//                 'drive-shots': 'drive-shots-image',
//             },
//             parents: [this.folderId],
//         };

//         const stream = new Duplex();
//         stream.push(screenshot.data);
//         stream.push(null);

//         const media = {
//             mimeType: mime.getType(screenshot.path),
//             body: stream,
//         };

//         const file = await this.drive.files.create({
//             resource,
//             media,
//             fields: 'id',
//         });

//         return {
//             name: resource.name,
//             id: file.data.id,
//         };
//     }

//     private async shareFile(image: DriveShotsImage): Promise<DriveShotsSharedImage> {
//         await this.drive.permissions.create(
//             {
//                 fileId: image.id,
//                 resource: {
//                     type: 'anyone',
//                     role: 'reader',
//                     allowFileDiscovery: false,
//                 },
//             },
//         );
//         const file = await this.drive.files.get(
//             {
//                 fileId: image.id,
//                 fields: 'id,name,webViewLink',
//             },
//         );
//         return {
//             ...image,
//             url: file.data.webViewLink,
//         };
//     }
// }
