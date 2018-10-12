import { Observable } from 'rxjs';

import { Screenshot } from './Screenshot';

export interface ScreenshotDetector {
  readonly onScreenshotDetected: Observable<Screenshot>;
}
