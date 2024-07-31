import { API_METADATA_URL } from './constants';
import { setup } from './isc';
import { newClient } from './client';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.Klass> = {};
  private static client = newClient(API_METADATA_URL);

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      // TO DO: Replace hardcoded 1 hour value (360000ms) with configurable setting
      return Date.now() - this.cache[windowId].updatedAt < 3600000;
    } 

    return false;
  }

  public static async get(windowId: Etendo.WindowId): Promise<Etendo.Klass> {
    setup();

    if (this.hasValidCache(windowId)) {
      console.log('cache hit')
      return this.cache[windowId].data;
    } else {
      console.log('cache miss')
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);

      // TO DO: Avoid the .replace and fix standardWindow issue
      eval(response.data.replace('this.standardWindow', 'null '));

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
