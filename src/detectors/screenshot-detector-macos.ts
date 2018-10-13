import { FSWatcher, watch } from 'chokidar';
import { app } from 'electron';
import { readFile } from 'fs';
import { injectable } from 'inversify';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';

import { Authenticator } from '../authentication/google-auth';
import { Logger } from '../utils/logger';
import { Screenshot } from './screenshot';
import { ScreenshotDetector } from './screenshot-detector';

const WATCH_PATH = join(app.getPath('desktop'), 'Screen*.png');

@injectable()
export class ScreenshotDetectorMacos implements ScreenshotDetector {
  private _onScreenshotDetected: Subject<Screenshot> = new Subject();
  private watcher: FSWatcher | undefined;

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
            this.logger.error(
              'ScreenshotDetector: Error during readfile.',
              err,
            );
            return;
          }
          this.logger.debug(
            'ScreenshotDetector: Found new screenshot from desktop.',
          );
          this._onScreenshotDetected.next({
            path,
            data,
          });
        });
      });
    } else {
      if (this.watcher) {
        this.watcher.close();
        delete this.watcher;
      }
    }
  }
}
