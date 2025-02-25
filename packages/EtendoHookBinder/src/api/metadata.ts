import {
  API_DATASOURCE_URL,
  API_DEFAULT_CACHE_DURATION,
  API_METADATA_URL,
  API_KERNEL_SERVLET,
  API_DATASOURCE_SERVLET,
} from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';
import { Menu } from './types';

export type { Etendo };

export class Metadata {
  public static client = new Client(API_METADATA_URL);
  public static kernelClient = new Client(API_KERNEL_SERVLET);
  public static datasourceClient = new Client(API_DATASOURCE_URL);
  public static datasourceServletClient = new Client(API_DATASOURCE_SERVLET);
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);
  private static currentRoleId: string | null = null;

  public static setLanguage(value: string) {
    [this.client, this.datasourceClient, this.kernelClient, this.datasourceServletClient].forEach(client =>
      client.setLanguageHeader(value)
    );

    return this;
  }

  public static setToken(token: string) {
    [this.client, this.datasourceClient, this.kernelClient, this.datasourceServletClient].forEach(client =>
      client.setAuthHeader(token, 'Bearer').addQueryParam('stateless', 'true')
    );

    return this;
  }

  public static registerInterceptor(interceptor: Interceptor) {
    const listener1 = this.client.registerInterceptor(interceptor);
    const listener2 = this.datasourceClient.registerInterceptor(interceptor);
    const listener3 = this.kernelClient.registerInterceptor(interceptor);
    const listener4 = this.datasourceServletClient.registerInterceptor(interceptor);

    return () => {
      listener1();
      listener2();
      listener3();
      listener4();
    };
  }

  public static getDatasource(id: string, body: BodyInit | Record<string, unknown> | null | undefined) {
    return this.datasourceClient.post(id, body);
  }

  private static async _getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const { data } = await this.client.post(`window/${windowId}`);

    this.cache.set(`window-${windowId}`, data);
    data.tabs.forEach((tab: Record<string, string>) => {
      this.cache.set(`tab-${tab.id}`, tab);
    });

    return data;
  }

  public static async getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const cached = this.cache.get<Etendo.WindowMetadata>(`window-${windowId}`);

    if (cached) {
      return cached;
    } else {
      return this._getWindow(windowId);
    }
  }

  public static getColumns(tabId: string): Etendo.Column[] {
    return this.cache.get<{ fields: Etendo.Column[] }>(`tab-${tabId}`)?.fields ?? [];
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
    return this.cache.get<Menu[]>('OBMenu') ?? [];
  }

  public static getCachedWindow(windowId: string): Etendo.WindowMetadata {
    return this.cache.get<Etendo.WindowMetadata>(`window-${windowId}`) || ({} as Etendo.WindowMetadata);
  }

  public static clearMenuCache() {
    this.cache.delete('OBMenu');
    this.currentRoleId = null;
  }

  public static clearWindowCache(windowId: string) {
    this.cache.delete(`window-${windowId}`);
  }

  public static forceWindowReload(windowId: string) {
    return this._getWindow(windowId);
  }

  public static getTabsColumns(tabs?: Etendo.Tab[]) {
    return (tabs || []).reduce((cols, tab) => {
      cols[tab.id] = this.getColumns(tab.id);

      return cols;
    }, {} as Record<string, Etendo.Column[]>);
  }

  public static evaluateExpression(expr: string, values: Record<string, unknown>) {
    const conditions = expr.split('||').map(c => c.trim());

    return conditions.some(condition => {
      const matches = condition.match(/OB\.Utilities\.getValue\(currentValues,['"](.+)['"]\)\s*===\s*(.+)/);
      if (!matches) return false;

      const [, property, expectedValueStr] = matches;
      const actualValue = values[property];

      if (expectedValueStr.startsWith("'") || expectedValueStr.startsWith('"')) {
        return actualValue === expectedValueStr.slice(1, -1);
      }

      return actualValue === JSON.parse(expectedValueStr);
    });
  }
}
