import { randomBytes } from 'crypto';
import { clipboard, Notification } from 'electron';
import { existsSync, unlinkSync } from 'fs';
import { drive_v3 } from 'googleapis/build/src/apis/drive/v3';
import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import { parse } from 'path';
import { combineLatest, Observable, Subject } from 'rxjs';
import { Duplex } from 'stream';

import { Authenticator } from '../authentication/google-auth';
import { JsonConfig } from '../config/json-config';
import { Screenshot } from '../detectors/Screenshot';
import { ScreenshotDetector } from '../detectors/screenshot-detector';
import { IocSymbols } from '../ioc-symbols';
import {
  DriveShotsImage,
  DriveShotsSharedImage,
} from '../models/drive-shots-image';
import { UrlShortener } from '../url-shortener/smrtv-shortener';
import { Logger } from '../utils/logger';

const mime = require('mime');
const opn = require('opn');

@injectable()
export class DriveUploader {
  private folderId: string = '';
  private _onStartUploading: Subject<Screenshot> = new Subject();
  private _onFinishedUploading: Subject<Screenshot> = new Subject();

  public get onStartUploading(): Observable<Screenshot> {
    return this._onStartUploading;
  }

  public get onFinishedUploading(): Observable<Screenshot> {
    return this._onFinishedUploading;
  }

  constructor(
    authenticator: Authenticator,
    @inject(IocSymbols.screenshotDetector) detector: ScreenshotDetector,
    private readonly drive: drive_v3.Drive,
    private readonly shortener: UrlShortener,
    private readonly logger: Logger,
    @inject(IocSymbols.config) private readonly config: JsonConfig,
  ) {
    combineLatest(
      authenticator.onAuthenticationChanged,
      detector.onScreenshotDetected,
    ).subscribe(data => this.upload(data));
  }

  private async upload([authenticated, screenshot]: [
    boolean,
    Screenshot
  ]): Promise<void> {
    this.logger.debug('DriveUploader: upload a new screenshot');
    if (!authenticated) {
      this.logger.info(
        'DriveUploader: user not authenticated, cannot upload anything.',
      );
      delete this.folderId;
      return;
    }
    if (!this.folderId) {
      this.logger.info(
        'DriveUploader: no folder id present, find drive folder.',
      );
      // google and typescript ¯\_(ツ)_/¯
      const body = await this.drive.files.list({
        q:
          `mimeType = 'application/vnd.google-apps.folder' and ` +
          `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
        fields: 'files(id)',
      } as any);

      if (body.data.files && body.data.files.length <= 0) {
        this.logger.info(
          'DriveUploader: no folder found, creating drive folder.',
        );
        // google and typescript ¯\_(ツ)_/¯
        const folder = await this.drive.files.create({
          resource: {
            name: 'DriveShots',
            mimeType: 'application/vnd.google-apps.folder',
            appProperties: {
              'drive-shots': 'drive-shots-folder',
            },
          },
          fields: 'id',
        } as any);
        this.folderId = folder.data.id || '';
        this.logger.debug(
          `DriveUploader: created folder with id "${this.folderId}".`,
        );
      } else {
        this.folderId = (body.data.files || [])[0].id || '';
        this.logger.debug(
          `DriveUploader: found folder with id "${this.folderId}".`,
        );
      }
    }

    this._onStartUploading.next(screenshot);
    const image = await this.uploadToFolder(screenshot);
    const sharedImage = await this.shareFile(image);

    const images = this.config.get(
      'shared-images',
      [] as DriveShotsSharedImage[],
    );
    images.unshift(sharedImage);
    this.logger.debug(`DriveUploader: add image to the history list.`);
    this.config.set('shared-images', images.slice(0, 10));

    clipboard.writeText(sharedImage.url);

    if (existsSync(screenshot.path)) {
      this.logger.debug(`DriveUploader: delete image file from system.`);
      unlinkSync(screenshot.path);
    }

    this._onFinishedUploading.next(screenshot);

    const notification = new Notification({
      title: 'Screenshot uploaded',
      body: 'The URL has been copied to your clipboard.',
    });

    notification.on('click', () => {
      this.logger.debug(`DriveUploader: notification clicked, open url.`);
      opn(sharedImage.url);
    });

    notification.show();
  }

  private async uploadToFolder(
    screenshot: Screenshot,
  ): Promise<DriveShotsImage> {
    const resource = {
      name: `${moment().format('YYYY-MM-DDTHH-mm-ss')}_${randomBytes(
        4,
      ).toString('hex')}${parse(screenshot.path).ext}`,
      appProperties: {
        'drive-shots': 'drive-shots-image',
      },
      parents: [this.folderId],
    };
    this.logger.debug(`DriveUploader: upload data to drive.`);
    const stream = new Duplex();
    stream.push(screenshot.data);
    stream.push(null);

    const media = {
      mimeType: mime.getType(screenshot.path),
      body: stream,
    };

    // google and typescript ¯\_(ツ)_/¯
    const file = await this.drive.files.create({
      resource,
      media,
      fields: 'id',
    } as any);

    return {
      name: resource.name,
      id: file.data.id || '',
    };
  }

  private async shareFile(
    image: DriveShotsImage,
  ): Promise<DriveShotsSharedImage> {
    this.logger.debug(
      `DriveUploader: create share permissions for image "${image.name}".`,
    );
    // google and typescript ¯\_(ツ)_/¯
    await this.drive.permissions.create({
      fileId: image.id,
      resource: {
        type: 'anyone',
        role: 'reader',
        allowFileDiscovery: false,
      },
    } as any);
    // google and typescript ¯\_(ツ)_/¯
    const file = await this.drive.files.get({
      fileId: image.id,
      fields: 'id,name,webViewLink',
    } as any);
    return {
      ...image,
      url: await this.shortener.shorten(file.data.webViewLink || ''),
    };
  }
}
