import { API_DATASOURCE_URL, TOKEN } from './constants';
import { Client } from './client';
import { MetadataParams } from './types';

export class Datasource {
  private static client = new Client(API_DATASOURCE_URL).setAuthHeader(TOKEN);

  public static async get(entity: string, options: MetadataParams = {}) {
    try {
      options._operationType = 'fetch';

      const result = await this.client.post(
        entity,
        //@ts-expect-error Update Metadata params definition
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
