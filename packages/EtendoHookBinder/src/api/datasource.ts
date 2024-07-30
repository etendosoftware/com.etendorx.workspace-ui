import axios from 'axios';
import { API_DATASOURCE_URL, TOKEN } from './constants';

export class Datasource {
  private static client = axios.create({
    baseURL: API_DATASOURCE_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Basic ${TOKEN}`,
    },
  });

  public static get(
    entity: Etendo.Entity,
    options: Partial<Etendo.MetadataParams> = {},
  ) {
    return this.client.post(
      entity,
      new URLSearchParams({
        _operationType: 'fetch',
        ...(options as Etendo.Object),
      }),
    );
  }
}
