import { Client, type Interceptor } from './client';
import { API_DATASOURCE_SERVLET } from './constants';
import type { DatasourceParams } from './types';

export class Datasource {
  private static instance: Datasource;
  public client: Client;

  private constructor(url: string) {
    this.client = new Client(url);
  }

  public static getInstance(url = '') {
    if (!Datasource.instance) {
      Datasource.instance = new Datasource(url);
    }

    return Datasource.instance;
  }

  public setBaseUrl(url: string) {
    this.client.setBaseUrl(url + API_DATASOURCE_SERVLET);
  }

  public setToken(token: string) {
    this.client.setAuthHeader(token, 'Bearer');
  }

  public registerInterceptor(interceptor: Interceptor) {
    return this.client.registerInterceptor(interceptor);
  }

  public get(entity: string, options: Record<string, unknown> = {}) {
    try {
      return this.client.post(entity, this.buildParams(options));
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity}: ${error}`);

      throw error;
    }
  }

  public async getSingleRecord(entity: string, id: string) {
    try {
      const { data } = await this.client.request(`${entity}/${id}`);

      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity} with ID ${id} - ${error}`);

      throw error;
    }
  }

  private buildParams(options: DatasourceParams) {
    const params = new URLSearchParams({
      _noCount: 'true',
      _operationType: 'fetch',
      isImplicitFilterApplied: options.isImplicitFilterApplied ? 'true' : 'false',
    });

    if (options.windowId) {
      params.set('windowId', options.windowId);
    }

    if (options.tabId) {
      params.set('tabId', options.tabId);
    }

    for (const [key, value] of Object.entries(options)) {
      if (typeof value !== 'undefined') {
        if (key === 'criteria' && Array.isArray(value)) {
          for (const criteria of value) {
            params.append(key, JSON.stringify(criteria));
          }
        } else {
          params.append(`_${key}`, Array.isArray(value) ? value.join(',') : String(value));
        }
      }
    }

    return params;
  }
}

export const datasource = Datasource.getInstance();
