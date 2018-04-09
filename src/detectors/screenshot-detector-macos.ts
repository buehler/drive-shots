import { FSWatcher, watch } from 'chokidar';
import { app } from 'electron';
import { readFile } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';

import { Authentication } from '../authentication';
import { iocSymbols } from '../ioc-symbols';
import { Screenshot } from './Screenshot';
import { ScreenshotDetector } from './screenshot-detector';

const WATCH_PATH = join(app.getPath('desktop'), 'Screen Shot*.png');

@injectable()
export class ScreenshotDetectorMacos implements ScreenshotDetector {
    private _screenshotDetected: Subject<Screenshot> = new Subject();
    private watcher: FSWatcher | undefined;

    public get screenshotDetected(): Observable<Screenshot> {
        return this._screenshotDetected;
    }

    constructor(
        @inject(iocSymbols.authentication) private readonly auth: Authentication,
    ) { }

    public setup(): void {
        this.auth.authenticationChanged.subscribe(auth => this.authChanged(auth));
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
                    this._screenshotDetected.next({
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
