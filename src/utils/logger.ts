import { debug, error, info, transports, warn } from 'electron-log';
import { inject, injectable } from 'inversify';

import { JsonConfig } from '../config/json-config';
import { IocSymbols } from '../ioc-symbols';

@injectable()
export class Logger {
  public get level(): 'debug' | 'info' | 'warn' | 'error' {
    return this.config.get('log-level', 'warn');
  }

  public set level(value: 'debug' | 'info' | 'warn' | 'error') {
    this.config.set('log-level', value);
    transports.file.level = value;
  }

  constructor(@inject(IocSymbols.config) private readonly config: JsonConfig) {
    this.level = this.level;
  }

  public debug(...params: any[]): void {
    debug(...params);
  }

  public info(...params: any[]): void {
    info(...params);
  }

  public warn(...params: any[]): void {
    warn(...params);
  }

  public error(...params: any[]): void {
    error(...params);
  }
}
