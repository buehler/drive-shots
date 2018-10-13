import 'reflect-metadata';

import { DriveShots } from './drive-shots';
import { container } from './ioc';

export function startup(): void {
  container.get(DriveShots).start();
}
