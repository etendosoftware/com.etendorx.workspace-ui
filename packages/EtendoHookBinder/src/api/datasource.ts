import { API_DATASOURCE_URL } from './constants';
import { Client } from './client';
import type { MetadataParams } from 'Etendo';

export class Datasource {
  private static client = new Client(API_DATASOURCE_URL);

  public static async get(entity: string, options = {} as MetadataParams) {
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
