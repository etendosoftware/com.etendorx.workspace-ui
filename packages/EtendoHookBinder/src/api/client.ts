import { TOKEN } from './constants';
interface ClientOptions extends RequestInit {
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export class Client {
  private baseHeaders: HeadersInit;
  private baseUrl: string;
  private readonly JSON_CONTENT_TYPE = 'application/json'!;
  private readonly FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded'!;

  constructor(url: string, baseHeaders: ClientOptions['headers'] = {}) {
    this.baseUrl = url.endsWith('/') ? url : url + '/';
    this.baseHeaders = {
      ...baseHeaders,
      Authorization: `Basic ${TOKEN}`,
    };
  }

  private cleanUrl(url: string) {
    return url.startsWith('/') ? url.substring(1) : url;
  }

  private isJson(response: Response) {
    return (
      response.headers.get('Content-Type')?.includes('application/json') ??
      false
    );
  }

  private setContentType(options: ClientOptions) {
    const { headers = {}, body } = options;

    if (!headers['Content-Type']) {
      headers['Content-Type'] =
        body instanceof URLSearchParams || typeof body === 'string'
          ? this.FORM_CONTENT_TYPE
          : this.JSON_CONTENT_TYPE;
    }

    options.headers = headers;
  }

  private async request(url: string, options: ClientOptions = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${this.cleanUrl(url)}`, {
        ...options,
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
      });

      if (options.method !== 'GET') {
        this.setContentType(options);
      }

      const data = await (this.isJson(response)
        ? response.json()
        : response.text());

      return {
        ...response,
        data,
      };
    } catch (error) {
      console.error('API client request failed', {
        url,
        options,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  public async get(url: string, options: ClientOptions = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  public async post(
    url: string,
    payload: ClientOptions['body'],
    options: ClientOptions = {},
  ) {
    return this.request(url, { ...options, body: payload, method: 'POST' });
  }
}
