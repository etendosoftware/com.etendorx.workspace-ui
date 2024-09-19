import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL } from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';
import { Menu } from './types';

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

  private static async _getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    const { data } = await Metadata.client.post(`window/${windowId}`);

    Metadata.cache.set(`window-${windowId}`, data);
    data.tabs.forEach((tab: Record<string, string>) => {
      Metadata.cache.set(`tab-${tab.id}`, tab);
    });

    return data;
  }

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    const cached = Metadata.cache.get(`window-${windowId}`);

    if (cached) {
      return cached;
    } else {
      return Metadata._getWindow(windowId);
    }
  }

  public static getColumns(tabId: string): Etendo.Column[] {
    return Object.values(Metadata.cache.get(`tab-${tabId}`)?.fields ?? {});
  }

  public static async getSession() {
    const response = await Metadata.client.get(
      `/OBCLKER_Kernel/SessionDynamic`,
    );

    this.client.run(response.data);

    // return Metadata.OB.User;
    return {};
  }

  public static async getMenu(): Promise<Menu[]> {
    const cached = Metadata.cache.get('OBMenu');

    if (cached && cached.length) {
      return cached;
    } else {
      const { data } = await this.client.post('menu');
      Metadata.cache.set('OBMenu', data);

      return data;
    }
  }

  public static getCachedMenu(): Menu[] {
    return Metadata.cache.get('OBMenu') ?? [];
  }
}
