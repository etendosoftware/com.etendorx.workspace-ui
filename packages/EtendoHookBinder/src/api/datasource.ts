import { API_DATASOURCE_URL } from './constants';
import { Client, Interceptor } from './client';
import { DatasourceParams } from './types';

export class Datasource {
  public static client = new Client(API_DATASOURCE_URL);

  public static setToken(token: string) {
    Datasource.client.setAuthHeader(token, 'Bearer');
  }

  public static registerInterceptor(interceptor: Interceptor) {
    return Datasource.client.registerInterceptor(interceptor);
  }

  public static async get(entity: string, options: Record<string, unknown> = {}) {
    try {
      const { data } = await Datasource.client.post(entity, Datasource.buildFormData(options));

      return data;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity}: ${error}`);
      throw error;
    }
  }

  public static async getSingleRecord(entity: string, id: string) {
    try {
      const { data } = await Datasource.client.post(`${entity}/${id}`);

      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity} with ID ${id} - ${error}`);

      throw error;
    }
  }

  private static buildFormData(
    options: Record<string, unknown>,
  ): Record<string, unknown> | BodyInit | null | undefined {
    const result = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        result.append(key, String(value));
      }
    });

    return result;
  }

  private static buildParams(options: DatasourceParams) {
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

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'criteria' && Array.isArray(value)) {
          value.forEach(criteria => {
            params.append(key, JSON.stringify(criteria));
          });
        } else {
          params.append(`_${key}`, Array.isArray(value) ? value.join(',') : value.toString());
        }
      }
    });

    return params;
  }
}
