import { drive_v3 } from 'googleapis';
import { inject, injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';

import { Authenticator } from '../authentication/google-auth';
import { JsonConfig } from '../config/json-config';
import { IocSymbols } from '../ioc-symbols';
import { Logger } from '../utils/logger';

@injectable()
export class HistoryDetector {
  private _onHistoryDetected: Subject<void> = new Subject();

  public get onHistoryDetected(): Observable<void> {
    return this._onHistoryDetected;
  }

  constructor(
    private readonly authenticator: Authenticator,
    private readonly drive: drive_v3.Drive,
    private readonly logger: Logger,
    @inject(IocSymbols.config) private readonly config: JsonConfig,
  ) {
    this.authenticator.onAuthenticationChanged.subscribe(auth =>
      this.getScreenHistory(auth),
    );
  }

  private async getScreenHistory(authenticated: boolean): Promise<void> {
    if (!authenticated) {
      this.logger.debug('HistoryDetector: not authenticated.');
      return;
    }

    const images = await this.drive.files.list({
      q: `appProperties has { key = 'drive-shots' and value = 'drive-shots-image' }`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, appProperties, webViewLink)',
    } as any);

    if (!images.data.files) {
      this.logger.info('HistoryDetector: no data files found online.');
      return;
    }

    this.config.set(
      'shared-images',
      images.data.files.slice(0, 10).map((googleFile: any) => ({
        id: googleFile.id,
        name: googleFile.name,
        url: googleFile.appProperties['short-url'] || googleFile.webViewLink,
      })),
    );
    this.logger.info(
      `HistoryDetector: Found ${images.data.files.length} files online.`,
    );
    this._onHistoryDetected.next();
  }
}
