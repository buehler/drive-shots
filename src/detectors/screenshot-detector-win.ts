import { FSWatcher } from 'chokidar';
import { app, clipboard, NativeImage } from 'electron';
import { injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';

import Screenshot from './Screenshot';
import ScreenshotDetector from './screenshot-detector';

const WATCH_PATH = `${app.getPath('home')}/Desktop/Screen Shot*.png`;

@injectable()
export default class ScreenshotDetectorWin implements ScreenshotDetector {
    private _screenshotDetected: Subject<Screenshot> = new Subject();
    private watcher: FSWatcher;

    public get screenshotDetected(): Observable<Screenshot> {
        return this._screenshotDetected;
    }

    private lastImage: NativeImage;

    public setup(): void {
        setInterval(
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
    }

    private hasDifference(newImage: NativeImage): boolean {
        if (!this.lastImage) {
            return true;
        }

        return newImage.toDataURL() !== this.lastImage.toDataURL();
    }
}
