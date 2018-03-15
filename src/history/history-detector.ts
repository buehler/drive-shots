import { inject, injectable } from 'inversify';

import Authentication from '../authentication';
import { JsonConfig } from '../config/json-config';
import DriveApi from '../google/drive-api';
import iocSymbols from '../ioc-symbols';
import TrayIcon from '../menu/tray-icon';

@injectable()
export default class HistoryDetector {
    constructor(
        @inject(iocSymbols.authentication) private readonly authentication: Authentication,
        @inject(iocSymbols.drive) private readonly drive: DriveApi,
        @inject(iocSymbols.config) private readonly config: JsonConfig,
        @inject(iocSymbols.trayIcon) private readonly trayIcon: TrayIcon,
    ) { }

    public setup(): void {
        this.authentication.authenticationChanged.subscribe(auth => this.getScreenHistory(auth));
    }

    private async getScreenHistory(authenticated: boolean): Promise<void> {
        if (!authenticated) {
            return;
        }

        const images = await this.drive.files.list(
            {
                q: `appProperties has { key = 'drive-shots' and value = 'drive-shots-image' }`,
                orderBy: 'createdTime desc',
                fields: 'files(id, name, appProperties, webViewLink)',
            },
        );

        this.config.set(
            'shared-images',
            images.data.files
                .slice(0, 10)
                .map(googleFile => ({
                    id: googleFile.id,
                    name: googleFile.name,
                    url: googleFile.appProperties['short-url'] || googleFile.webViewLink,
                })),
        );
        await this.trayIcon.buildContextMenu(authenticated);
    }
}
