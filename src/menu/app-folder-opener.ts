import { drive_v3 } from 'googleapis';
import { injectable } from 'inversify';

const opn = require('opn');

@injectable()
export class AppFolderOpener {
  constructor(private readonly drive: drive_v3.Drive) {}

  public async openAppFolder(): Promise<void> {
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
