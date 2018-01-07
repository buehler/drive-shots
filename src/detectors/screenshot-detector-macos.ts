import { FSWatcher, watch } from 'chokidar';
import { app } from 'electron';
import { inject, injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';

import Authentication from '../authentication/index';
import iocSymbols from '../ioc-symbols';
import Screenshot from './Screenshot';
import ScreenshotDetector from './screenshot-detector';

const WATCH_PATH = `${app.getPath('home')}/Desktop/Screen Shot*.png`;

@injectable()
export default class ScreenshotDetectorMacos implements ScreenshotDetector {
    private _screenshotDetected: Subject<Screenshot> = new Subject();
    private watcher: FSWatcher;

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
            this.watcher.on('add', path => this._screenshotDetected.next(path)); // TODO
        } else {
            if (this.watcher) {
                this.watcher.close();
                delete this.watcher;
            }
        }
    }
}
