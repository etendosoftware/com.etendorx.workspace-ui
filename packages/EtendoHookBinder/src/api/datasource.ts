import { API_DATASOURCE_URL } from './constants';
import { newClient } from './client';

export class Datasource {
  private static client = newClient(API_DATASOURCE_URL)

  public static async get(
    entity: Etendo.Entity,
    options: Etendo.MetadataParams = {},
  ) {
    try {
      options._operationType = 'fetch';

      const result = await this.client.post(
        entity,
        new URLSearchParams(options),
      );

      return result.data;
    } catch (error) {
      throw new Error(
        `Error fetching from datasource for entity ${entity}: ${error}`,
      );
    }
  }
}
