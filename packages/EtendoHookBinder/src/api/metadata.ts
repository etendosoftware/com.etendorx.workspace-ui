import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL, API_KERNEL_SERVLET, API_DATASOURCE_SERVLET } from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';
import { Menu } from './types';

export type { Etendo };

export class Metadata {
  public static client = new Client();
  public static kernelClient = new Client();
  public static datasourceServletClient = new Client();
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);
  private static currentRoleId: string | null = null;
  public static loginClient = new Client();
  private static language: string | null = null;

  public static setBaseUrl(url: string) {
    Metadata.client.setBaseUrl(url + API_METADATA_URL);
    Metadata.kernelClient.setBaseUrl(url + API_KERNEL_SERVLET);
    Metadata.datasourceServletClient.setBaseUrl(url + API_DATASOURCE_SERVLET);
    Metadata.loginClient.setBaseUrl(url + '/');
  }

  public static setLanguage(value: string) {
    this.language = value;
    [this.client, this.kernelClient, this.datasourceServletClient].forEach(client => client.setLanguageHeader(value));

    return this;
  }

  public static setToken(token: string) {
    [this.client, this.kernelClient, this.datasourceServletClient, this.loginClient].forEach(client =>
      client.setAuthHeader(token, 'Bearer'),
    );

    return this;
  }

  public static registerInterceptor(interceptor: Interceptor) {
    const listener1 = this.client.registerInterceptor(interceptor);
    const listener2 = this.kernelClient.registerInterceptor(interceptor);
    const listener3 = this.datasourceServletClient.registerInterceptor(interceptor);

    return () => {
      listener1();
      listener2();
      listener3();
    };
  }

  public static getDatasource(id: string, body: BodyInit | Record<string, unknown> | null | undefined) {
    return this.datasourceServletClient.post(id, body);
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

  private static async _getTab(tabId?: Etendo.Tab["id"]): Promise<Etendo.Tab> {
    const { data } = await this.client.post(`tab/${tabId}`);

    this.cache.set(`tab-${tabId}`, data);

    return data;
  }

  public static async getTab(tabId: Etendo.Tab["id"]): Promise<Etendo.Tab> {
    const cached = this.cache.get<Etendo.Tab>(`tab-${tabId}`);

    if (cached) {
      return cached;
    } else {
      return this._getTab(tabId);
    }
  }

  private static async _getLabels(): Promise<Etendo.Labels> {
    const { data } = await this.client.request(`labels`);

    this.cache.set(`labels-${this.language}`, data);

    return data;
  }

  public static async getLabels(): Promise<Etendo.Labels> {
    const cached = this.cache.get<Etendo.Labels>(`labels-${this.language}`);

    if (cached) {
      return cached;
    } else {
      return this._getLabels();
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
        const menu = data.menu;
        this.cache.set('OBMenu', menu);
        this.currentRoleId = currentRoleId;

        return menu;
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
    return (tabs || []).reduce(
      (cols, tab) => {
        cols[tab.id] = this.getColumns(tab.id);

        return cols;
      },
      {} as Record<string, Etendo.Column[]>,
    );
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
