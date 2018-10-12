import { google } from 'googleapis';
import { Drive } from 'googleapis/build/src/apis/drive/v3';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { inject, injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';
import { parse } from 'url';

import { JsonConfig } from '../config/json-config';
import { iocSymbols } from '../ioc-symbols';
import { AuthToken } from './auth-token';

@injectable()
export class Authentication {
  private _authenticationChanged: Subject<boolean> = new Subject();
  private server?: Server;

  public get authenticationChanged(): Observable<boolean> {
    return this._authenticationChanged;
  }

  constructor(
    @inject(iocSymbols.drive) private readonly drive: Drive,
    @inject(iocSymbols.config) private readonly config: JsonConfig,
  ) {}

  public async checkAuthentication(): Promise<void> {
    if (!this.config.has('google-auth-token')) {
      this._authenticationChanged.next(false);
      return;
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
      await this.drive.about.get({ fields: 'user' });
      this._authenticationChanged.next(true);
    } catch {
      this._authenticationChanged.next(false);
    }
  }

  public async authenticate(): Promise<void> {
    const token = await this.getAuthToken();
    this.stopListener();
    this.config.set('google-auth-token', token);
    this.checkAuthentication();
  }

  public deauthorize(): void {
    this.config.delete('google-auth-token');
    this.config.delete('shared-images');
    this._authenticationChanged.next(false);
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
