import { drive_v3 } from 'googleapis';
import { injectable } from 'inversify';
import { Logger } from '../utils/logger';

const opn = require('opn');

@injectable()
export class AppFolderOpener {
  constructor(
    private readonly drive: drive_v3.Drive,
    private readonly logger: Logger,
  ) {}

  public async openAppFolder(): Promise<void> {
    this.logger.debug('AppFolderOpener: Open the app folder');
    // google and typescript ¯\_(ツ)_/¯
    const body = await this.drive.files.list({
      q:
        `mimeType = 'application/vnd.google-apps.folder' and ` +
        `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
      fields: 'files(webViewLink)',
    } as any);
    if (body && body.data.files && body.data.files.length) {
      opn(body.data.files[0].webViewLink);
    }
  }
}
