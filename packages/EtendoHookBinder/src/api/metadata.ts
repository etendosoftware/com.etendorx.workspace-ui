import { API_METADATA_URL } from './constants';
import { setup } from './isc';
import { newClient } from './client';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.Klass> = {};
  private static client = newClient(API_METADATA_URL);

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      // To Do: Replace hardcoded 1 hour value (360000ms) with configurable setting
      return Date.now() - this.cache[windowId].updatedAt > 3600000;
    }

    return false;
  }

  public static async get(windowId: Etendo.WindowId): Promise<Etendo.Klass> {
    setup();

    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);

      eval(response.data.replace('this.standardWindow', '{}'));

      this.cache[windowId] = {
        updatedAt: Date.now(),
        data: window.classes[`_${windowId}`],
      };

      return this.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}:\n${error}`,
      );
    }
  }
}
