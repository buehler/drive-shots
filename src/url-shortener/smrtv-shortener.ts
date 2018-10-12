import { injectable } from 'inversify';

@injectable()
export class UrlShortener {
  public async shorten(url: string): Promise<string> {
    return url;
  }
}
