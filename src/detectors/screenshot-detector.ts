import { Observable } from 'rxjs';

import Screenshot from './Screenshot';

export default interface ScreenshotDetector {
    readonly screenshotDetected: Observable<Screenshot>;
    setup(): void | Promise<void>;
}
