import { app, MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';

import Assets from './assets';
import Authentication from './authentication';
import { getDriveUserInfo } from './drive';
import TrayIcon from './tray-icon';
import Watcher from './watcher';

autoUpdater.checkForUpdatesAndNotify();

app.dock.hide();

app.on('ready', async () => {
    const auth = new Authentication();

    const isAuthenticated = await auth.checkAuthentication();

    const template: MenuItemConstructorOptions[] = [
        { type: 'separator' },
        { label: 'Quit', click: () => { app.quit(); } },
    ];

    if (isAuthenticated) {
        const userinfo = await getDriveUserInfo();
        template.unshift({
            label: userinfo.displayName,
            icon: Assets.getNativeImage('images/drive.png'),
            type: 'submenu',
            submenu: [
                {
                    label: `usage: ${userinfo.usage} ${userinfo.unit}`,
                    enabled: false,
                },
                { type: 'separator' },
                {
                    label: 'Deauthorize',
                    async click(): Promise<void> {
                        console.log('asdf');
                    },
                },
            ],
        });
    } else {
        template.unshift({
            label: 'Authenticate Drive',
            icon: Assets.getNativeImage('images/drive.png'),
            async click(): Promise<void> {
                await auth.authenticate();
            },
        });
    }

    const tray = new TrayIcon(template);
    const watcher = new Watcher(tray);
    await watcher.start();
});
