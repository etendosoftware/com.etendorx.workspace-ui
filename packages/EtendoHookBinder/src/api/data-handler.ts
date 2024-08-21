import { API_DATASOURCE_SWS_URL } from './constants';
import { Client } from './client';
import { RecordPayload } from './types';

export class DataHandler {
  private static client = new Client(API_DATASOURCE_SWS_URL);

  public static setAuthorization(token: string) {
    this.client.setAuthHeader(token, 'Bearer');
  }

  // This method can be used for create new records or update existing records
  public static async post(payload: RecordPayload) {
    try {
      const result = await this.client.post(payload._entity_name, {
        data: [payload],
      });

      return result.data;
    } catch (error) {
      console.error(`Data handler error with payload: ${payload}`);

      throw error;
    }
  }
}
