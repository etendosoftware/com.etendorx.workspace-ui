import { CacheStore } from "./cache";
import { Client, type Interceptor } from "./client";
import { API_DATASOURCE_SERVLET, API_DEFAULT_CACHE_DURATION, API_KERNEL_SERVLET, API_METADATA_URL } from "./constants";
import type * as Etendo from "./types";
import type { Menu } from "./types";

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
    Metadata.loginClient.setBaseUrl(`${url}/`);
  }

  public static setLanguage(value: string) {
    Metadata.language = value;

    for (const client of [Metadata.client, Metadata.kernelClient, Metadata.datasourceServletClient]) {
      client.setLanguageHeader(value);
    }

    return Metadata;
  }

  public static setToken(token: string) {
    for (const client of [
      Metadata.client,
      Metadata.kernelClient,
      Metadata.datasourceServletClient,
      Metadata.loginClient,
    ]) {
      client.setAuthHeader(token, "Bearer");
    }

    return Metadata;
  }

  public static registerInterceptor(interceptor: Interceptor) {
    const listener1 = Metadata.client.registerInterceptor(interceptor);
    const listener2 = Metadata.kernelClient.registerInterceptor(interceptor);
    const listener3 = Metadata.datasourceServletClient.registerInterceptor(interceptor);

    return () => {
      listener1();
      listener2();
      listener3();
    };
  }

  public static getDatasource(id: string, body: BodyInit | Record<string, unknown> | null | undefined) {
    return Metadata.datasourceServletClient.post(id, body);
  }

  private static async _getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const { data, ok } = await Metadata.client.post(`window/${windowId}`);

    if (!ok) {
      throw new Error("Window not found");
    }

    Metadata.cache.set(`window-${windowId}`, data);
    for (const tab of data.tabs) {
      Metadata.cache.set(`tab-${tab.id}`, tab);
    }

    return data;
  }

  public static async getWindow(windowId: Etendo.WindowId): Promise<Etendo.WindowMetadata> {
    const cached = Metadata.cache.get<Etendo.WindowMetadata>(`window-${windowId}`);

    if (cached) {
      return cached;
    }
    return Metadata._getWindow(windowId);
  }

  private static async _getTab(tabId?: Etendo.Tab["id"]): Promise<Etendo.Tab> {
    const { data } = await Metadata.client.post(`tab/${tabId}`);

    Metadata.cache.set(`tab-${tabId}`, data);

    return data;
  }

  public static async getTab(tabId: Etendo.Tab["id"]): Promise<Etendo.Tab> {
    const cached = Metadata.cache.get<Etendo.Tab>(`tab-${tabId}`);

    if (cached) {
      return cached;
    }
    return Metadata._getTab(tabId);
  }

  private static async _getLabels(): Promise<Etendo.Labels> {
    const { data } = await Metadata.client.request("labels");

    Metadata.cache.set(`labels-${Metadata.language}`, data);

    return data;
  }

  public static async getLabels(): Promise<Etendo.Labels> {
    const cached = Metadata.cache.get<Etendo.Labels>(`labels-${Metadata.language}`);

    if (cached) {
      return cached;
    }
    return Metadata._getLabels();
  }

  public static getColumns(tabId: string): Etendo.Column[] {
    return Metadata.cache.get<{ fields: Etendo.Column[] }>(`tab-${tabId}`)?.fields ?? [];
  }

  public static async getMenu(forceRefresh = false): Promise<Menu[]> {
    const cached = Metadata.cache.get<Menu[]>("OBMenu");
    const currentRoleId = localStorage.getItem("currentRoleId");

    if (!forceRefresh && cached && cached.length && currentRoleId === Metadata.currentRoleId) {
      return cached;
    }
    try {
      const { data } = await Metadata.client.post("menu", { role: currentRoleId });
      const menu = data.menu;
      Metadata.cache.set("OBMenu", menu);
      Metadata.currentRoleId = currentRoleId;

      return menu;
    } catch (error) {
      console.error("Error fetching menu:", error);
      throw error;
    }
  }

  public static async refreshMenuOnLogin(): Promise<void> {
    Metadata.clearMenuCache();
    await Metadata.getMenu(true);
  }

  public static getCachedMenu(): Menu[] {
    return Metadata.cache.get<Menu[]>("OBMenu") ?? [];
  }

  public static getCachedWindow(windowId: string): Etendo.WindowMetadata {
    return Metadata.cache.get<Etendo.WindowMetadata>(`window-${windowId}`) || ({} as Etendo.WindowMetadata);
  }

  public static clearMenuCache() {
    Metadata.cache.delete("OBMenu");
    Metadata.currentRoleId = null;
  }

  public static clearWindowCache(windowId: string) {
    Metadata.cache.delete(`window-${windowId}`);
  }

  public static forceWindowReload(windowId: string) {
    return Metadata._getWindow(windowId);
  }

  public static getTabsColumns(tabs?: Etendo.Tab[]) {
    return (tabs || []).reduce(
      (cols, tab) => {
        cols[tab.id] = Metadata.getColumns(tab.id);

        return cols;
      },
      {} as Record<string, Etendo.Column[]>,
    );
  }

  public static evaluateExpression(expr: string, values: Record<string, unknown>) {
    const conditions = expr.split("||").map((c) => c.trim());

    return conditions.some((condition) => {
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
