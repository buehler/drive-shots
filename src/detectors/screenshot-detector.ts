import { Observable } from 'rxjs';

export default interface ScreenshotDetector {
    readonly screenshotDetected: Observable<string>;
    setup(): void | Promise<void>;
}
