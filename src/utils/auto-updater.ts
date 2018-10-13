import { autoUpdater } from 'electron-updater';
import { injectable } from 'inversify';
import { BehaviorSubject, Observable } from 'rxjs';
import { Logger } from './logger';

const CHECK_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

@injectable()
export class AutoUpdater {
  private _onUpdateAvailable: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );

  public get onUpdateAvailable(): Observable<boolean> {
    return this._onUpdateAvailable;
  }

  constructor(logger: Logger) {
    autoUpdater.on('error', err =>
      logger.error('AutoUpdater: there was an error.', err),
    );
    autoUpdater.on('checking-for-update', () =>
      logger.info('AutoUpdater: Check for update.'),
    );
    autoUpdater.on('update-available', () =>
      logger.info('AutoUpdater: Update available, download it.'),
    );
    autoUpdater.on('update-not-available', () =>
      logger.info('AutoUpdater: No update available.'),
    );
    autoUpdater.on('download-progress', progress =>
      logger.debug('AutoUpdater: Download progress.', progress),
    );
    autoUpdater.on('update-downloaded', () => {
      logger.info('AutoUpdater: Update is downloaded');
      this._onUpdateAvailable.next(true);
    });

    logger.debug('AutoUpdater: updater ready. check on startup.');
    autoUpdater.checkForUpdatesAndNotify();
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), CHECK_INTERVAL);
  }
}
