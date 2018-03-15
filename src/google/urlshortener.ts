import { google } from 'googleapis';

const promisify = require('util.promisify');
const urlshortener = google.urlshortener('v1');

for (const category of Object.keys(urlshortener).filter(key => !key.startsWith('_') && key !== 'google')) {
    const obj = urlshortener[category];
    for (const method of Object.keys(obj)) {
        obj[method] = promisify(obj[method]);
    }
}

export default urlshortener;
