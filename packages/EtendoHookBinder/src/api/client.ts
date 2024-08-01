import axios from 'axios';
import { TOKEN } from './constants';

export function createClient(baseURL: string) {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Basic ${TOKEN}`,
    },
  });
}

export class Client {
  private baseHeaders: HeadersInit = {};

  public constructor() {
    this.baseHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Basic ${TOKEN}`,
    };
  }

  public async get(url: string, options: RequestInit) {
    return fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers,
      },
    });
  }
}
