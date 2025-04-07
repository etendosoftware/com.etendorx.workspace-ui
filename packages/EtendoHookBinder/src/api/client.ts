/* eslint-disable @typescript-eslint/no-explicit-any */

import { AUTH_HEADER_NAME } from './constants';
import { getDecodedJsonResponse } from './utils';

export interface ClientOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  body?: RequestInit['body'] | Record<string, unknown>;
}

export type Interceptor = (response: Response) => Promise<Response> | Response;

export class UnauthorizedError extends Error {
  public response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }
}

export class Client {
  private baseHeaders: HeadersInit;
  private baseQueryParams: URLSearchParams;
  private baseUrl: string;
  private interceptor: Interceptor | null;
  private readonly JSON_CONTENT_TYPE = 'application/json'!;
  private readonly FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded'!;

  constructor(url?: string) {
    this.baseUrl = url || '';
    this.baseHeaders = {};
    this.interceptor = null;
    this.baseQueryParams = new URLSearchParams();
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private cleanUrl(url: string) {
    return url.startsWith('/') ? url.substring(1) : url;
  }

  private isJson(response: Response) {
    return response.headers.get('Content-Type')?.includes('application/json') ?? false;
  }

  private setContentType(options: ClientOptions) {
    const { headers = {}, body } = options;

    if (!headers['Content-Type']) {
      headers['Content-Type'] =
        body instanceof URLSearchParams || typeof body === 'string' || body instanceof FormData
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

  public setLanguageHeader(value: string) {
    this.baseQueryParams.set('language', value);

    return this;
  }

  public addQueryParam(key: string, value: string) {
    this.baseQueryParams.set(key, value);

    return this;
  }
  public async request(url: string, options?: ClientOptions): Promise<Response & { data: any }>;
  public async request<T>(url: string, options?: ClientOptions): Promise<Response & { data: T }>;
  public async request<T>(url: string, options: ClientOptions = {}): Promise<Response & { data: T | any }> {
    try {
      if (options.method !== 'GET') {
        this.setContentType(options);
      }

      const destination = new URL(`${this.baseUrl}${this.cleanUrl(url)}`);
      this.baseQueryParams.forEach((value, key) => destination.searchParams.append(key, value));

      let response: any = await fetch(destination, {
        ...options,
        body:
          typeof options.body === 'string' ||
          options.body instanceof URLSearchParams ||
          options.body instanceof FormData
            ? options.body
            : options.body
              ? JSON.stringify(options.body)
              : undefined,
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
      });

      if (typeof this.interceptor === 'function') {
        response = await this.interceptor(response);
      }

      response.data = await (this.isJson(response) ? getDecodedJsonResponse<T>(response) : response.text());

      return response;
    } catch (error) {
      console.warn('API client request failed', {
        url,
        options,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  public registerInterceptor(interceptor: Interceptor) {
    this.interceptor = interceptor;

    return () => (this.interceptor = null);
  }

  public async post<T = any>(
    url: string,
    payload: ClientOptions['body'] = null,
    options: ClientOptions = {},
  ): Promise<
    Response & {
      data: T;
    }
  > {
    return this.request<T>(url, { ...options, body: payload, method: 'POST' });
  }
}
