import axios from 'axios';
import { API_METADATA_URL } from './constants';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.Metadata> = {};
  private static client = axios.create({
    baseURL: API_METADATA_URL,
    // Implement JWT authentication and drop coookies auth
    withCredentials: true,
  });

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      // To Do: Replace hardcoded 1 hour value (360000ms) with configurable setting
      return Date.now() - this.cache[windowId].updatedAt > 3600000;
    }

    return false;
  }

  public static async fetchMetadata(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.Metadata> {
    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`, {});

      this.cache[windowId] = {
        updatedAt: Date.now(),
        data: response.data,
      };

      return this.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}: ${error}`,
      );
    }
  }
}
