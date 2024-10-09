import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL } from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';
import { Menu } from './types';

export type { Etendo };

export class Metadata {
  public static client = new Client(API_METADATA_URL);
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);
  private static currentRoleId: string | null = null;

  public static authorize(token: string) {
    this.client.setAuthHeader(token, 'Bearer');
  }

  public static registerInterceptor(interceptor: Interceptor) {
    return this.client.registerInterceptor(interceptor);
  }

  private static async _getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const { data } = await Metadata.client.post(`window/${windowId}`);

    Metadata.cache.set(`window-${windowId}`, data);
    data.tabs.forEach((tab: Record<string, string>) => {
      Metadata.cache.set(`tab-${tab.id}`, tab);
    });

    return data;
  }

  public static async getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const cached = Metadata.cache.get<Etendo.WindowMetadata>(`window-${windowId}`);

    if (cached) {
      return cached;
    } else {
      return Metadata._getWindow(windowId);
    }
  }

  public static getColumns(tabId: string): Etendo.Column[] {
    return Metadata.cache.get<{ fields: Etendo.Column[] }>(`tab-${tabId}`)?.fields ?? [];
  }

  public static async getSession() {
    const response = await Metadata.client.get(`/OBCLKER_Kernel/SessionDynamic`);

    this.client.run(response.data);

    return {};
  }

  public static async getMenu(forceRefresh: boolean = false): Promise<Menu[]> {
    const cached = this.cache.get<Menu[]>('OBMenu');
    const currentRoleId = localStorage.getItem('currentRoleId');

    if (!forceRefresh && cached && cached.length && currentRoleId === this.currentRoleId) {
      return cached;
    } else {
      try {
        const { data } = await this.client.post('menu', { role: currentRoleId });
        this.cache.set('OBMenu', data);
        this.currentRoleId = currentRoleId;
        return data;
      } catch (error) {
        console.error('Error fetching menu:', error);
        throw error;
      }
    }
  }

  public static async refreshMenuOnLogin(): Promise<void> {
    this.clearMenuCache();
    await this.getMenu(true);
  }

  public static getCachedMenu(): Menu[] {
    return Metadata.cache.get<Menu[]>('OBMenu') ?? [];
  }

  public static clearMenuCache() {
    Metadata.cache.delete('OBMenu');
    this.currentRoleId = null;
  }
}
