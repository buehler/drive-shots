const { app, Notification } = require('electron');
const { TrayIcon } = require('./tray-icon');

app.dock.hide();

app.on('ready', () => {
    console.log(TrayIcon)
});
