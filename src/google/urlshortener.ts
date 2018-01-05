import googleapis = require('googleapis');

const promisify = require('util.promisify');
const urlshortener = googleapis.urlshortener('v1');

for (const category of Object.keys(urlshortener)) {
    const obj = urlshortener[category];
    for (const method of Object.keys(obj)) {
        obj[method] = promisify(obj[method]);
    }
}

export default urlshortener;
