import { app } from 'electron';
import { injectable } from 'inversify';
import { Observable } from 'rxjs';

import ScreenshotDetector from './screenshot-detector';

const WATCH_PATH = `${app.getPath('home')}/Desktop/Screen Shot*.png`;

@injectable()
export default class ScreenshotDetectorWin implements ScreenshotDetector {
    public get screenshotDetected(): Observable<string> {
        return Observable.empty();
    }

    public setup(): void {
        console.log(WATCH_PATH);
    }
}