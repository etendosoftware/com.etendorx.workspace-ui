import { TOKEN } from './constants';

export class Client {
  private baseHeaders: HeadersInit = {};
  private baseUrl: string;

  constructor(url: string) {
    this.baseUrl = url.endsWith('/') ? url : url + '/';
    this.baseHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Authorization: `Basic ${TOKEN}`,
    };
  }

  private cleanUrl(url: string) {
    return url.startsWith('/') ? url.substring(1) : url;
  }

  private isJson(response: Response) {
    return !!response.headers.get('Content-Type')?.match('application/json');
  }

  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${this.cleanUrl(url)}`, {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers,
      },
    });

    const data = await (this.isJson(response)
      ? response.json()
      : response.text());

    return {
      ...response,
      data,
    };
  }

  public async get(url: string, options: RequestInit = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  public async post(url: string, options: RequestInit = {}) {
    return this.request(url, { ...options, method: 'POST' });
  }
}
