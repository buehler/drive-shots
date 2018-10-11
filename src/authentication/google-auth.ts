import { injectable } from 'inversify';
import { BehaviorSubject, Observable } from 'rxjs';

@injectable()
export class Authenticator {
  private _onAuthenticationChanged: BehaviorSubject<
    boolean
  > = new BehaviorSubject(false);

  public get onAuthenticationChanged(): Observable<boolean> {
    return this._onAuthenticationChanged;
  }

  public authenticate(): void {}
}
