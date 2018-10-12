import { put, Response } from 'got';
import { injectable } from 'inversify';

const shortenerUrl = 'https://smr.tv/api/links';

@injectable()
export class UrlShortener {
  public async shorten(url: string): Promise<string> {
    const shortUrl = (await put(shortenerUrl, {
      json: true,
      body: { url },
      headers: {
        Authorization:
          'ApiKey UaCDZm3Z1W63likKTQ6BlgAS7W892hMPSq5PtEjJ8bUqYvPtU01zUdQE6IEna9ML',
      },
    })) as Response<{ url: string; shortUrl: string }>;
    return shortUrl.body.shortUrl;
  }
}
