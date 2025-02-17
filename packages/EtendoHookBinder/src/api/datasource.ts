import { API_DATASOURCE_URL } from './constants';
import { Client, Interceptor } from './client';
import { DatasourceParams } from './types';

export class Datasource {
  public static client = new Client(API_DATASOURCE_URL);

  public static authorize = (token: string) => {
    this.client.setAuthHeader(token, 'Bearer');
  };

  public static registerInterceptor = (interceptor: Interceptor) => this.client.registerInterceptor(interceptor);

  public static async get(
    entity: string,
    options: DatasourceParams = {},
    operationType = 'fetch',
    noCount = true,
  ) {
    try {
      const params = new URLSearchParams({
        isImplicitFilterApplied: options.isImplicitFilterApplied ? 'true' : 'false',
        _noCount: noCount ? 'true' : 'false',
        _operationType: operationType,
        windowId: options.windowId || "",
        tabId: options.tabId || "",
      });

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

      const result = await this.client.post(entity, params);

      return result.data;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity}: ${error}`);
      throw error;
    }
  }

  public static async getSingleRecord(entity: string, id: string) {
    try {
      const { data } = await this.client.post(`${entity}/${id}`);

      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity} with ID ${id} - ${error}`);

      throw error;
    }
  }
}
