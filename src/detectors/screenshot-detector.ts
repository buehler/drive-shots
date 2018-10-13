import { Observable } from 'rxjs';

import { Screenshot } from './screenshot';

export interface ScreenshotDetector {
  readonly onScreenshotDetected: Observable<Screenshot>;
}
