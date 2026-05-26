/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Client, type Interceptor } from "./client";
import type { DatasourceParams } from "./types";

export class Datasource {
  private static instance: Datasource;
  public client: Client;
  private pendingRequests: Map<string, { promise: Promise<unknown>; timestamp: number }>;
  // In-memory response cache. Stores completed responses with a TTL so that
  // re-opening the same tab or switching back does not trigger a redundant request.
  // Cleared explicitly by clearCache()/clearCacheForEntity() after write operations.
  private responseCache: Map<string, { data: unknown; expiresAt: number }>;
  private readonly RESPONSE_CACHE_TTL_MS = 30_000;

  private constructor(url: string) {
    this.client = new Client(url);
    this.pendingRequests = new Map();
    this.responseCache = new Map();
  }

  public static getInstance() {
    if (!Datasource.instance) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      Datasource.instance = new Datasource(baseUrl);
    }

    return Datasource.instance;
  }

  public setBaseUrl(_url: string) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    this.client.setBaseUrl(baseUrl);
  }

  public setToken(token: string) {
    this.client.setAuthHeader(token, "Bearer");
  }

  public registerInterceptor(interceptor: Interceptor) {
    return this.client.registerInterceptor(interceptor);
  }

  /**
   * Clear all pending requests from the deduplication cache
   * Useful after save/update operations to ensure fresh data is fetched
   */
  public clearCache() {
    this.pendingRequests.clear();
    this.responseCache.clear();
  }

  /**
   * Clear pending requests for a specific entity from the deduplication cache
   * @param entity - The entity name to clear from cache
   */
  public clearCacheForEntity(entity: string) {
    const keysToDelete: string[] = [];

    // Convert iterator to array to avoid downlevelIteration issues
    const keys = Array.from(this.pendingRequests.keys());
    for (const key of keys) {
      try {
        const parsed = JSON.parse(key);
        if (parsed.entity === entity) {
          keysToDelete.push(key);
        }
      } catch {
        // Skip invalid keys
      }
    }

    for (const key of keysToDelete) {
      this.pendingRequests.delete(key);
    }

    // Also evict completed responses for this entity from the response cache
    const responseCacheKeys = Array.from(this.responseCache.keys());
    for (const key of responseCacheKeys) {
      try {
        const parsed = JSON.parse(key);
        if (parsed.entity === entity) {
          this.responseCache.delete(key);
        }
      } catch {
        // Skip invalid keys
      }
    }
  }

  public get(entity: string, options: Record<string, unknown> = {}) {
    try {
      const params = this.buildParams(options);

      // Create a unique key for this request to deduplicate identical calls
      const requestKey = JSON.stringify({ entity, params });
      const now = Date.now();

      // 1. Return a cached completed response if still within TTL
      const cached = this.responseCache.get(requestKey);
      if (cached && now < cached.expiresAt) {
        return Promise.resolve(cached.data);
      }

      // 2. Reuse an in-flight request for the same key (deduplication)
      const existing = this.pendingRequests.get(requestKey);
      if (existing) {
        return existing.promise;
      }

      // 3. Make a new request, cache the response on success
      const requestPromise = this.client
        .post("/api/datasource", {
          entity,
          params,
        })
        .then((response) => {
          this.responseCache.set(requestKey, {
            data: response,
            expiresAt: Date.now() + this.RESPONSE_CACHE_TTL_MS,
          });
          return response;
        })
        .finally(() => {
          // Remove from pending requests when done (success or error)
          this.pendingRequests.delete(requestKey);
        });

      // Store the promise with timestamp so duplicate requests can reuse it
      this.pendingRequests.set(requestKey, { promise: requestPromise, timestamp: now });

      return requestPromise;
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity}: ${error}`);

      throw error;
    }
  }

  private buildParams(options: DatasourceParams) {
    const params: Record<string, unknown> = {
      _noCount: "true",
      _operationType: "fetch",
      isImplicitFilterApplied: options.isImplicitFilterApplied ? "true" : "false",
    };
    const formatKey = (key: string): string => {
      const keysToPrefix = new Set([
        "dataSource",
        "operationType",
        "noCount",
        "extraProperties",
        "textMatchStyle",
        "UTCOffsetMiliseconds",
        "constructor",
        "sortBy",
        "startRow",
        "endRow",
        "summary",
        "noActiveFilter",
        "className",
        "componentId",
        "org",
        "sqlWhere",
        "isPickAndEdit",
        "isSorting",
      ]);

      if (keysToPrefix.has(key)) {
        return `_${key}`;
      }

      return key;
    };

    // Arrays must be preserved as-is so the proxy (`/api/datasource/route.ts`)
    // serializes them as repeated form-urlencoded keys
    // (`accounting_status=id1&accounting_status=id2&...`), which is what Classic
    // Etendo's OBPickAndExecuteDataSource expects to drive its `IN (...)` filter
    // for multi-record selectors. Joining them into a CSV here silently
    // collapses N values into a single param the backend can't decode.
    const formatValue = (value: unknown) => (Array.isArray(value) ? value : String(value));

    if (options.windowId) params.windowId = options.windowId;
    if (options.tabId) params.tabId = options.tabId;

    if (Array.isArray(options.criteria) && options.criteria.length > 0) {
      params.criteria = options.criteria.map((criteria) => JSON.stringify(criteria));
    } else if (typeof options.criteria === "string" && options.criteria.trim() !== "") {
      params.criteria = options.criteria;
    } else if (
      typeof options.criteria === "object" &&
      options.criteria !== null &&
      !Array.isArray(options.criteria) &&
      Object.keys(options.criteria).length > 0
    ) {
      params.criteria = JSON.stringify(options.criteria);
    }

    if (options.parentId) {
      params.parentId = options.parentId;
    }

    for (const [key, value] of Object.entries(options)) {
      if (
        typeof value === "undefined" ||
        key === "criteria" ||
        key === "windowId" ||
        key === "tabId" ||
        key === "isImplicitFilterApplied"
      )
        continue;
      params[formatKey(key)] = formatValue(value);
    }

    return params;
  }
}

export const datasource = Datasource.getInstance();
