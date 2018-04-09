import { Drive } from 'googleapis/build/src/apis/drive/v3';
import { inject, injectable } from 'inversify';

import iocSymbols from '../ioc-symbols';

const opn = require('opn');

@injectable()
export default class AppFolderOpener {
    constructor(
        @inject(iocSymbols.drive) private readonly drive: Drive,
    ) { }

    public async openAppFolder(): Promise<void> {
        const body = await this.drive.files.list(
            {
                q: `mimeType = 'application/vnd.google-apps.folder' and ` +
                    `appProperties has { key = 'drive-shots' and value = 'drive-shots-folder' }`,
                fields: 'files(webViewLink)',
            },
        );
        if (body && body.data.files.length) {
            opn(body.data.files[0].webViewLink);
        }
    }
}
