import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL } from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';

export type { Etendo };

export class Metadata {
  public static client = new Client(API_METADATA_URL);
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);

  public static authorize(token: string) {
    this.client.setAuthHeader(token, 'Bearer');
  }

  public static registerInterceptor(interceptor: Interceptor) {
    return this.client.registerInterceptor(interceptor);
  }

  public static initialize = () => {
    return true;
  };

  // TODO: Remove empty object and update with the right value
  public static standardWindow = {};

  private static async _getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    const response = await Metadata.client.post(`window/${windowId}`);
    const value = response.data;

    Metadata.cache.set(windowId, value);

    return value;
  }

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    const cached = Metadata.cache.get(windowId);

    if (cached) {
      return cached;
    } else {
      return Metadata._getWindow(windowId);
    }
  }

  public static getColumns(tabId: string) {
    tabId;

    return [];
    // const item = Object.values(Metadata.isc.classes).find(windowObj => {
    //   const val =
    //     windowObj.properties?.viewProperties?.tabId?.toString() ===
    //     tabId.toString();

    //   return val;
    // });

    // if (!item) {
    //   return [];
    // }

    // return item.properties.viewProperties.fields;
  }

  public static async getSession() {
    const response = await Metadata.client.get(
      `/OBCLKER_Kernel/SessionDynamic`,
    );

    this.client.run(response.data);

    // return Metadata.OB.User;
    return {};
  }

  public static async getMenu() {
    const cached = Metadata.cache.get('OBMenu');

    if (cached && cached.length) {
      return cached;
    } else {
      const { data } = await this.client.post('menu');
      Metadata.cache.set('OBMenu', data);

      return data;
    }
  }

  public static getCachedMenu() {
    return Metadata.cache.get('OBMenu') ?? [];
  }
}
