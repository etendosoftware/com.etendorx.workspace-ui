import { API_DATASOURCE_URL, API_DEFAULT_CACHE_DURATION, API_METADATA_URL, API_KERNEL_SERVLET } from './constants';
import { Client, Interceptor } from './client';
import { CacheStore } from './cache';
import * as Etendo from './types';
import { Menu } from './types';

export type { Etendo };

export class Metadata {
  public static client = new Client(API_METADATA_URL);
  public static kernelClient = new Client(API_KERNEL_SERVLET);
  public static datasourceClient = new Client(API_DATASOURCE_URL);
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);
  private static currentRoleId: string | null = null;
  private static token: string | null = null;

  public static setLanguage(value: string) {
    this.client.setLanguageHeader(value);
    this.datasourceClient.setLanguageHeader(value);
    this.kernelClient.setLanguageHeader(value);
  }

  public static setToken(token: string) {
    this.token = token;
    this.client.setAuthHeader(token, 'Bearer').addQueryParam('stateless', 'true');
    this.datasourceClient.setAuthHeader(token, 'Bearer').addQueryParam('stateless', 'true');
    this.kernelClient.setAuthHeader(token, 'Bearer').addQueryParam('stateless', 'true');
  }

  public static getToken() {
    return this.token;
  }

  public static registerInterceptor(interceptor: Interceptor) {
    const listener1 = this.client.registerInterceptor(interceptor);
    const listener2 = this.datasourceClient.registerInterceptor(interceptor);
    const listener3 = this.kernelClient.registerInterceptor(interceptor);

    return () => {
      listener1();
      listener2();
      listener3();
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

  public static evaluateExpression(
    expr: string,
    values: Record<string, unknown>,
    contextValues: Record<string, unknown> = {},
  ): boolean {
    if (!expr) return true;

    try {
      const conditions = expr.split('||').map(c => c.trim());

      return conditions.some(condition => {
        const andConditions = condition.split('&&').map(c => c.trim());

        return andConditions.every(subCondition => {
          // Handle direct context access
          if (subCondition.startsWith('context.')) {
            const matches = subCondition.match(/context\.(\$?\w+)\s*([!==|===]+)\s*['"]([^'"]+)['"]/);
            if (!matches) {
              return false;
            }
            const [, contextKey, operator, value] = matches;
            const contextValue = contextValues[contextKey];
            const result = this.compareValues(contextValue, operator, value);

            if (contextKey === '$IsAcctDimCentrally' && result) {
              const docbaseType = 'SOO'; // Hardcodeamos SOO por ahora
              const fullKey = `$Element_OO_${docbaseType}_H`;

              const secondPartResult = this.compareValues(contextValues[fullKey], '===', 'Y');

              return secondPartResult;
            }

            return result;
          }

          // Handle dynamic context access
          if (subCondition.includes("context['")) {
            const matches = subCondition.match(/context\[['"]([^'"]+)['"]\]\s*([!==|===]+)\s*['"]([^'"]+)['"]/);
            if (!matches) {
              return false;
            }
            const [, keyExpr, operator, expectedValue] = matches;

            if (keyExpr.includes('OB.Utilities.getValue')) {
              const fieldMatch = keyExpr.match(/OB\.Utilities\.getValue\(currentValues,\s*["'](.+?)["']\)/);
              if (!fieldMatch) {
                return false;
              }

              const [, field] = fieldMatch;

              // TEMPORAL: Hardcodeamos "SOO" si el campo es DOCBASETYPE
              const docbaseType = field === 'DOCBASETYPE' ? 'SOO' : values[field];

              const fullKey = keyExpr.replace(
                /OB\.Utilities\.getValue\(currentValues,\s*["'].+?["']\)/,
                docbaseType as string,
              );

              const contextValue = contextValues[fullKey];

              const result = this.compareValues(contextValue, operator, expectedValue);

              return result;
            }

            return this.compareValues(contextValues[keyExpr], operator, expectedValue);
          }

          const matches = subCondition.match(
            /OB\.Utilities\.getValue\(currentValues,\s*['"](.+)['"]\)\s*([!==><]+)\s*(.+)/,
          );
          if (!matches) return false;

          const [, property, operator, rawValue] = matches;
          const actualValue = property === 'DOCBASETYPE' ? 'SOO' : values[property];
          const expectedValue = this.parseValue(rawValue);

          const result = this.compareValues(actualValue, operator, expectedValue);

          return result;
        });
      });
    } catch (error) {
      console.error('Error in expression evaluation:', error);
      return true;
    }
  }

  private static compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    // Normalize values
    if (actual === undefined || actual === null) actual = '';
    if (expected === undefined || expected === null) expected = '';

    // Handle Y/N conversion for context values
    if (typeof actual === 'string') {
      if (actual === 'Y') actual = true;
      if (actual === 'N') actual = false;
    }
    if (typeof expected === 'string') {
      if (expected === 'Y') expected = true;
      if (expected === 'N') expected = false;
    }

    switch (operator) {
      case '===':
        return actual === expected;
      case '!==':
        return actual !== expected;
      case '<=':
        return Number(actual) <= Number(expected);
      case '>=':
        return Number(actual) >= Number(expected);
      case '<':
        return Number(actual) < Number(expected);
      case '>':
        return Number(actual) > Number(expected);
      default:
        return false;
    }
  }

  private static parseValue(value: string): unknown {
    value = value.trim();
    if (value === 'null') return null;
    if (value === "''") return '';
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }
}
