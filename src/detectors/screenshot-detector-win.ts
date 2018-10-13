import { FSWatcher, watch } from 'chokidar';
import { app, clipboard, NativeImage } from 'electron';
import { readFile } from 'fs';
import { injectable } from 'inversify';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';

import { Authenticator } from '../authentication/google-auth';
import { Logger } from '../utils/logger';
import { Screenshot } from './Screenshot';
import { ScreenshotDetector } from './screenshot-detector';

const WATCH_PATH = join(app.getPath('pictures'), 'Screenshots');

@injectable()
export class ScreenshotDetectorWin implements ScreenshotDetector {
  private _onScreenshotDetected: Subject<Screenshot> = new Subject();
  private watcher: FSWatcher | undefined;
  private interval: NodeJS.Timer | undefined;
  private lastImage: NativeImage | undefined;

  public get onScreenshotDetected(): Observable<Screenshot> {
    return this._onScreenshotDetected;
  }

  constructor(authenticator: Authenticator, private readonly logger: Logger) {
    authenticator.onAuthenticationChanged.subscribe(auth =>
      this.authChanged(auth),
    );
  }

  private authChanged(authenticated: boolean): void {
    this.logger.debug('ScreenshotDetector: the authentication state changed.');
    if (authenticated) {
      this.watcher = watch(WATCH_PATH);
      this.watcher.on('add', (path: string) => {
        readFile(path, (err, data) => {
          if (err) {
            this.logger.debug(
              'ScreenshotDetector: Error during readfile.',
              err,
            );
            return;
          }
          this.logger.debug(
            'ScreenshotDetector: Found new screenshot from file.',
          );
          this._onScreenshotDetected.next({
            path,
            data,
          });
        });
      });

      this.interval = setInterval(() => {
        const img = clipboard.readImage();

        if (img && !img.isEmpty() && this.hasDifference(img)) {
          this.logger.debug(
            'ScreenshotDetector: Found new screenshot from clipboard.',
          );
          this.lastImage = img;
          this._onScreenshotDetected.next({
            path: 'clipboard/image.png',
            data: img.toPNG(),
          });
          clipboard.clear();
        }
      },                          1000);
    } else {
      if (this.watcher) {
        this.watcher.close();
        delete this.watcher;
      }
      if (this.interval) {
        clearInterval(this.interval);
        delete this.interval;
      }
    }
  }

  private hasDifference(newImage: NativeImage): boolean {
    if (!this.lastImage) {
      return true;
    }

    return newImage.toDataURL() !== this.lastImage.toDataURL();
  }
}
