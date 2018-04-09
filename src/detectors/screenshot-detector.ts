import { Observable } from 'rxjs';

import { Screenshot } from './Screenshot';

export interface ScreenshotDetector {
    readonly screenshotDetected: Observable<Screenshot>;
    setup(): void | Promise<void>;
}
