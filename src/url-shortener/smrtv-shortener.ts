import { put, Response } from 'got';
import { injectable } from 'inversify';
import { Logger } from '../utils/logger';

const shortenerUrl = 'https://smr.tv/api/links';

@injectable()
export class UrlShortener {
  constructor(private readonly logger: Logger) {}

  public async shorten(url: string): Promise<string> {
    this.logger.debug(`UrlShortener: get short url for "${url}".`);
    try {
      const shortUrl = (await put(shortenerUrl, {
        json: true,
        body: { url },
        headers: {
          Authorization:
            'ApiKey UaCDZm3Z1W63likKTQ6BlgAS7W892hMPSq5PtEjJ8bUqYvPtU01zUdQE6IEna9ML',
        },
      })) as Response<{ url: string; shortUrl: string }>;
      return shortUrl.body.shortUrl;
    } catch (e) {
      this.logger.error('UrlShortener: got an error during shortening.', e);
      return url;
    }
  }
}
