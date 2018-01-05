import 'reflect-metadata';

import DriveShots from './drive-shots';
import ioc from './ioc';
import iocSymbols from './ioc-symbols';

const driveShots = ioc.get<DriveShots>(iocSymbols.driveShots);
driveShots.start();
