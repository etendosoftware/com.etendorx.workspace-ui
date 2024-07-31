import axios from 'axios';
import { API_DATASOURCE_URL, TOKEN } from './constants';

export class Datasource {
  private static client = axios.create({
    baseURL: API_DATASOURCE_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Authorization: `Basic ${TOKEN}`,
    },
  });

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
