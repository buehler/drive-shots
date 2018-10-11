import { FSWatcher, watch } from 'chokidar';
import { app, clipboard, NativeImage } from 'electron';
import { readFile } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';

import { Authentication } from '../authentication';
import { iocSymbols } from '../ioc-symbols';
import { Screenshot } from './Screenshot';
import { ScreenshotDetector } from './screenshot-detector';

const WATCH_PATH = join(app.getPath('pictures'), 'Screenshots');

@injectable()
export class ScreenshotDetectorWin implements ScreenshotDetector {
    private _screenshotDetected: Subject<Screenshot> = new Subject();
    private watcher: FSWatcher | undefined;
    private interval: NodeJS.Timer | undefined;
    private lastImage: NativeImage | undefined;

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
            this.watcher.on(
                'add',
                (path: string) => {
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
                },
            );

            this.interval = setInterval(
                () => {
                    const img = clipboard.readImage();

                    if (img && !img.isEmpty() && this.hasDifference(img)) {
                        this.lastImage = img;
                        this._screenshotDetected.next({
                            path: 'clipboard/image.png',
                            data: img.toPNG(),
                        });
                        clipboard.clear();
                    }
                },
                1000,
            );
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
