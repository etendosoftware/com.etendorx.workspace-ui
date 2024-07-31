import axios from 'axios';
import { API_METADATA_URL, TOKEN } from './constants';
import { setupIsc } from './isc';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.Klass> = {};
  private static client = axios.create({
    baseURL: API_METADATA_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Basic ${TOKEN}`,
    },
  });

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      // To Do: Replace hardcoded 1 hour value (360000ms) with configurable setting
      return Date.now() - this.cache[windowId].updatedAt > 3600000;
    }

    return false;
  }

  public static async get(windowId: Etendo.WindowId): Promise<Etendo.Klass> {
    setupIsc();

    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);

      eval(
        response.data.replace('this.standardWindow', '{}'),
      );

      this.cache[windowId] = {
        updatedAt: Date.now(),
        data: window.isc.classes[`_${windowId}`],
      };

      return this.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}: ${error}`,
      );
    }
  }
}
