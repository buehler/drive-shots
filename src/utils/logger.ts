import { debug, error, info, warn } from 'electron-log';
import { injectable } from 'inversify';

@injectable()
export class Logger {
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
