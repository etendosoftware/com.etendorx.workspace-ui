import { AUTH_HEADER_NAME } from './constants';
interface ClientOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: RequestInit['body'] | Record<string, unknown>;
}

export class UnauthorizedError extends Error {
  public response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }
}

export class Client {
  private baseHeaders: HeadersInit;
  private baseUrl: string;
  private readonly JSON_CONTENT_TYPE = 'application/json'!;
  private readonly FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded'!;

  constructor(url: string) {
    this.baseUrl = url.endsWith('/') ? url : url + '/';
    this.baseHeaders = {};
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

  public setAuthHeader(header: string, type: 'Basic' | 'Bearer' = 'Basic') {
    this.baseHeaders = {
      ...this.baseHeaders,
      [AUTH_HEADER_NAME]: `${type} ${header}`,
    };

    return this;
  }

  private async isUnauthorized(response: Response) {
    if (response.status === 401) {
      return true;
    }

    if (response.headers.get('Content-Type')?.match('application/javascript')) {
      const _response = await response.clone().text();

      return _response.startsWith('window.location.href');
    }

    return false;
  }

  private async request(url: string, options: ClientOptions = {}) {
    try {
      if (options.method !== 'GET') {
        this.setContentType(options);
      }

      const response = await fetch(`${this.baseUrl}${this.cleanUrl(url)}`, {
        ...options,
        body:
          options.body instanceof URLSearchParams ||
          typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body),
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
      });

      if (await this.isUnauthorized(response)) {
        throw new UnauthorizedError('Unauthorized', response);
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

  public run(js: string) {
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.textContent = js;
    document.head.appendChild(script);
    document.head.removeChild(script);
  }
}
