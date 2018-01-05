import 'reflect-metadata';

import { Container } from 'inversify';
import { platform } from 'os';

import App from './app';

export const iocSymbols = {

};

const ioc = new Container();

// General bindings

ioc.bind(App).to(App).inSingletonScope();
// Logger
// Auth
// Drive

// Windows bindings

if (platform() === 'win32') {
    console.log('windows');
}
// Screenshot Detection (in files & clipboard)
// Menu
// Tray?

// OSX bindings

if (platform() === 'darwin') {
    console.log('macos');
}
// Screenshot Detection (in files)
// Menu
// Tray?

// Linux bindings

if (platform() === 'linux') {
    console.log('linux');
}
// Screenshot Detection (in files & clipboard)
// Menu
// Tray?

export default ioc;
