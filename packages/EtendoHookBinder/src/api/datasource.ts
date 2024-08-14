import { API_DATASOURCE_URL, TOKEN } from './constants';
import { Client } from './client';
import { DatasourceParams } from './types';

export type { DatasourceParams };

export class Datasource {
  private static client = new Client(API_DATASOURCE_URL).setAuthHeader(TOKEN);

  public static async get(
    entity: string,
    windowId: string,
    tabId: string,
    options: DatasourceParams = {},
  ) {
    try {
      const params = new URLSearchParams({
        windowId,
        tabId,
        _isImplicitFilterApplied: 'true',
        _noCount: 'true',
        _operationType: 'fetch',
      });

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'criteria' && Array.isArray(value)) {
            value.forEach(criteria => {
              params.append(key, JSON.stringify(criteria));
            });
          } else {
            params.append(
              `_${key}`,
              Array.isArray(value) ? value.join(',') : value.toString(),
            );
          }
        }
      });

      const result = await this.client.post(entity, params);

      return result.data;
    } catch (error) {
      throw new Error(
        `Error fetching from datasource for entity ${entity}: ${error}`,
      );
    }
  }
}
