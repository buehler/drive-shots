import { autoUpdater } from 'electron-updater';
import { injectable } from 'inversify';
import { BehaviorSubject, Observable } from 'rxjs';

const CHECK_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

@injectable()
export class AutoUpdater {
  private _onUpdateAvailable: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );

  public get onUpdateAvailable(): Observable<boolean> {
    return this._onUpdateAvailable;
  }

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this._onUpdateAvailable.next(
      !!(await autoUpdater.checkForUpdatesAndNotify()),
    );

    setInterval(
      async () =>
        this._onUpdateAvailable.next(
          !!(await autoUpdater.checkForUpdatesAndNotify()),
        ),
      CHECK_INTERVAL,
    );
  }
}
