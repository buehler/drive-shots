import { randomBytes } from 'crypto';
import { clipboard } from 'electron';
import { existsSync, unlinkSync } from 'fs';
import { drive_v3 } from 'googleapis/build/src/apis/drive/v3';
import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import { parse } from 'path';
import { combineLatest } from 'rxjs';
import { Duplex } from 'stream';

import { Authenticator } from '../authentication/google-auth';
import { JsonConfig } from '../config/json-config';
import { Screenshot } from '../detectors/Screenshot';
import { ScreenshotDetector } from '../detectors/screenshot-detector';
import { IocSymbols } from '../ioc-symbols';
import { TrayIconState } from '../menu/tray-icon-state';
import { TrayMenu } from '../menu/tray-menu';
import {
  DriveShotsImage,
  DriveShotsSharedImage,
} from '../models/drive-shots-image';
import { UrlShortener } from '../url-shortener/smrtv-shortener';

const mime = require('mime');
const opn = require('opn');

@injectable()
export class DriveUploader {
  private folderId: string = '';

  constructor(
    authenticator: Authenticator,
    @inject(IocSymbols.screenshotDetector) detector: ScreenshotDetector,
    private readonly drive: drive_v3.Drive,
    private readonly trayMenu: TrayMenu,
    private readonly shortener: UrlShortener,
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
    if (!authenticated) {
      delete this.folderId;
      return;
    }
    if (!this.folderId) {
      // google and typescript ¯\_(ツ)_/¯
      const body = await this.drive.files.list({
        q:
          `mimeType = 'application/vnd.google-apps.folder' and ` +
          `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
        fields: 'files(id)',
      } as any);

      if (body.data.files && body.data.files.length <= 0) {
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
      } else {
        this.folderId = (body.data.files || [])[0].id || '';
      }
    }

    this.trayMenu.state = TrayIconState.syncing;
    const image = await this.uploadToFolder(screenshot);
    const sharedImage = await this.shareFile(image);
    this.trayMenu.state = TrayIconState.idle;

    const images = this.config.get(
      'shared-images',
      [] as DriveShotsSharedImage[],
    );
    images.unshift(sharedImage);
    this.config.set('shared-images', images.slice(0, 10));

    clipboard.writeText(sharedImage.url);

    if (existsSync(screenshot.path)) {
      unlinkSync(screenshot.path);
    }

    // notify(
    //   {
    //     message: 'The URL has been copied to your clipboard.',
    //     title: 'Screenshot uploaded',
    //     icon: join(__dirname, '..', 'assets', 'images', 'icon.png'),
    //     wait: true,
    //   },
    //   (_err, response) => {
    //     // "activate" -> mac
    //     if (
    //       response.indexOf('clicked') >= 0 ||
    //       response.indexOf('activate') >= 0
    //     ) {
    //       opn(sharedImage.url);
    //     }
    //   },
    // );
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
