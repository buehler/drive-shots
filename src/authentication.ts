import googleapis = require('googleapis');
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { parse } from 'url';

import jsonConfig from './json-config';

const opn = require('opn');

interface AuthToken {
    access_token: string;
    expiry_date: number;
    refresh_token: string;
    token_type: string;
}

const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/urlshortener',
];

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Success</title>
</head>
<body>
    The authentication was a success.
    You may close this window.

    <script>
        // @grant window.close
        setTimeout(function(){
            window.close();
        }, 500);
    </script>
</body>
</html>
`;

export default class Authentication {
    private server?: Server;

    public checkAuthentication(): Promise<boolean> {
        if (!jsonConfig.has('google-auth-token')) {
            return Promise.resolve(false);
        }
        const token = jsonConfig.get('google-auth-token') as AuthToken;
        const auth = new googleapis.auth.OAuth2(
            '848319290605-ub6c120lupp321fj1al65m9nb9cf3eul.apps.googleusercontent.com',
            '0o5sCCiYLRjSjAkgC681U67v',
        );
        auth.credentials = token;
        googleapis.options({
            auth,
        });

        return new Promise((resolve) => {
            const drive = googleapis.drive('v3');
            drive.about.get(
                {
                    fields: 'user',
                },
                (err) => {
                    if (err) {
                        resolve(false);
                        return;
                    }
                    resolve(true);
                },
            );
        });
    }

    public async authenticate(): Promise<void> {
        const token = await this.getAuthToken();
        this.stopListener();
        jsonConfig.set('google-auth-token', token);
        const auth = new googleapis.auth.OAuth2(
            '848319290605-ub6c120lupp321fj1al65m9nb9cf3eul.apps.googleusercontent.com',
            '0o5sCCiYLRjSjAkgC681U67v',
        );
        auth.credentials = token;
        googleapis.options({
            auth,
        });
    }

    private getAuthToken(): Promise<AuthToken> {
        return new Promise(async (resolve, reject) => {
            let oauth: any;
            const handler = (request: IncomingMessage, response: ServerResponse) => {
                const parsed = parse(request.url || '');
                const params = (parsed.query + '' || '').split('&').map(param => param.split('='));

                if (params.some(param => param.indexOf('error') >= 0)) {
                    const err = params.find(p => p.indexOf('error') >= 0) || [];
                    response.writeHead(401, { 'Content-Type': 'text/html' });
                    response.write(`There was an error with the authentication: ${err[1]}`);
                    response.end();
                    reject();
                    return;
                }

                const code = (params.find(p => p.indexOf('code') >= 0) || [])[1];
                oauth.getToken(code, (err, token) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(token);
                });

                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.write(html);
                response.end();
            };

            const port = await this.startListener(handler);
            oauth = new googleapis.auth.OAuth2(
                '848319290605-ub6c120lupp321fj1al65m9nb9cf3eul.apps.googleusercontent.com',
                '0o5sCCiYLRjSjAkgC681U67v',
                `http://127.0.0.1:${port}`,
            );

            const url = oauth.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
            });

            opn(url);
        });
    }

    private startListener(handler: (request: IncomingMessage, response: ServerResponse) => void): Promise<number> {
        this.server = createServer(handler);

        return new Promise((resolve, reject) => {
            if (!this.server) {
                reject();
                return;
            }
            this.server.listen(0, () => {
                resolve(this.server!.address().port);
            });
        });
    }

    private stopListener(): void {
        if (!this.server) {
            return;
        }
        this.server.close();
        this.server = undefined;
    }
}
