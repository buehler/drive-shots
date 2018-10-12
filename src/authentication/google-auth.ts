import { drive_v3, google } from 'googleapis';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { inject, injectable } from 'inversify';
import { BehaviorSubject, Observable } from 'rxjs';
import { parse } from 'url';

import { JsonConfig } from '../config/json-config';
import { IocSymbols } from '../ioc-symbols';
import { AuthToken } from './auth-token';

const opn = require('opn');

const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
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

@injectable()
export class Authenticator {
  private server?: Server;
  private _onAuthenticationChanged: BehaviorSubject<
    boolean
  > = new BehaviorSubject(false);

  public get onAuthenticationChanged(): Observable<boolean> {
    return this._onAuthenticationChanged;
  }

  constructor(
    @inject(IocSymbols.config) private readonly config: JsonConfig,
    private readonly drive: drive_v3.Drive,
  ) {
    this.isAuthenticated().then(auth =>
      this._onAuthenticationChanged.next(auth),
    );
  }

  public async authenticate(): Promise<void> {
    const token = await this.getAuthToken();
    this.stopListener();
    this.config.set('google-auth-token', token);
    this._onAuthenticationChanged.next(await this.isAuthenticated());
  }

  public deauthorize(): void {
    this.config.delete('google-auth-token');
    this.config.delete('shared-images');
    this._onAuthenticationChanged.next(false);
  }

  private getAuthToken(): Promise<AuthToken> {
    return new Promise(async (resolve, reject) => {
      let oauth: any;
      const handler = (request: IncomingMessage, response: ServerResponse) => {
        const parsed = parse(request.url || '');
        const params = (parsed.query + '' || '')
          .split('&')
          .map(param => param.split('='));

        if (params.some(param => param.indexOf('error') >= 0)) {
          const err = params.find(p => p.indexOf('error') >= 0) || [];
          response.writeHead(401, { 'Content-Type': 'text/html' });
          response.write(
            `There was an error with the authentication: ${err[1]}`,
          );
          response.end();
          reject();
          return;
        }

        const code = (params.find(p => p.indexOf('code') >= 0) || [])[1];
        if (!code) {
          response.end();
          return;
        }
        oauth.getToken(code, (err: Error, token: AuthToken) => {
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
      oauth = new google.auth.OAuth2(
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

  private startListener(
    handler: (request: IncomingMessage, response: ServerResponse) => void,
  ): Promise<number> {
    this.server = createServer(handler);

    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject();
        return;
      }
      this.server.listen(0, () => {
        const adr = this.server!.address();
        resolve(typeof adr === 'string' ? parseInt(adr, 10) : adr.port);
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

  private async isAuthenticated(): Promise<boolean> {
    if (!this.config.has('google-auth-token')) {
      return false;
    }

    const token = this.config.get('google-auth-token') as AuthToken;
    const auth = new google.auth.OAuth2(
      '848319290605-ub6c120lupp321fj1al65m9nb9cf3eul.apps.googleusercontent.com',
      '0o5sCCiYLRjSjAkgC681U67v',
    );
    auth.credentials = token;
    google.options({
      auth,
    });

    try {
      // google and typescript ¯\_(ツ)_/¯
      await this.drive.about.get({ fields: 'user' } as any);
      return true;
    } catch {
      return false;
    }
  }
}
