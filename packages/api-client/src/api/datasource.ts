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
import { isWrappedWithAt } from "../utils/datasource/utils";

export class Datasource {
  private static instance: Datasource;
  public client: Client;
  private pendingRequests: Map<string, { promise: Promise<unknown>; timestamp: number }>;

  private constructor(url: string) {
    this.client = new Client(url);
    this.pendingRequests = new Map();
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
  }

  public get(entity: string, options: Record<string, unknown> = {}) {
    try {
      const params = this.buildParams(options);

      // Create a unique key for this request to deduplicate identical calls
      const requestKey = JSON.stringify({ entity, params });
      const now = Date.now();

      // Check if there's an existing pending request
      const existing = this.pendingRequests.get(requestKey);
      if (existing) {
        return existing.promise;
      }

      // Post to the Next.js API route with entity and params
      const requestPromise = this.client
        .post("/api/datasource", {
          entity,
          params,
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
      const specialKeys = new Set([
        "ad_org_id",
        "c_currency_id",
        "issotrx",
        "received_from",
        "c_currency_to_id",
        "exportAs",
        "exportToFile",
        // CSV export parameters that should not have underscore prefix added
        "_dataSource",
        "_operationType",
        "_noCount",
        "_extraProperties",
        "_textMatchStyle",
        "_UTCOffsetMiliseconds",
        "_constructor",
        "_sortBy",
        "_startRow",
        "_startRow",
        "_endRow",
        "_summary",
        "_noActiveFilter",
        "_className",
        "Constants_FIELDSEPARATOR",
        "Constants_IDENTIFIER",
        "viewState",
        "operator",
        "criteria",
      ]);

      return specialKeys.has(key) || isWrappedWithAt(key) ? key : `_${key}`;
    };

    const formatValue = (value: unknown) => (Array.isArray(value) ? value.join(",") : String(value));

    if (options.windowId) params.windowId = options.windowId;
    if (options.tabId) params.tabId = options.tabId;

    if (Array.isArray(options.criteria)) {
      params.criteria = options.criteria.map((criteria) => JSON.stringify(criteria));
    } else if (options.criteria && typeof options.criteria === "string") {
      params.criteria = options.criteria;
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
