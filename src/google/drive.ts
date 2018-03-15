import { google } from 'googleapis';

const promisify = require('util.promisify');
const drive = google.drive('v3');

for (const category of Object.keys(drive).filter(key => !key.startsWith('_') && key !== 'google')) {
    const obj = drive[category];
    for (const method of Object.keys(obj)) {
        obj[method] = promisify(obj[method]);
    }
}

export default drive;
