import { FSWatcher, watch } from 'chokidar';
import { app } from 'electron';
import { readFile } from 'fs';
import { injectable } from 'inversify';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';

import { Authenticator } from '../authentication/google-auth';
import { Screenshot } from './Screenshot';
import { ScreenshotDetector } from './screenshot-detector';

const WATCH_PATH = join(app.getPath('desktop'), 'Screen*.png');

@injectable()
export class ScreenshotDetectorMacos implements ScreenshotDetector {
  private _onScreenshotDetected: Subject<Screenshot> = new Subject();
  private watcher: FSWatcher | undefined;

  public get onScreenshotDetected(): Observable<Screenshot> {
    return this._onScreenshotDetected;
  }

  constructor(authenticator: Authenticator) {
    authenticator.onAuthenticationChanged.subscribe(auth =>
      this.authChanged(auth),
    );
  }

  private authChanged(authenticated: boolean): void {
    if (authenticated) {
      this.watcher = watch(WATCH_PATH);
      this.watcher.on('add', (path: string) => {
        readFile(path, (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
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
