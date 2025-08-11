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

  private constructor(url: string) {
    this.client = new Client(url);
  }

  public static getInstance(url = "") {
    if (!Datasource.instance) {
      // Initialize with current origin + API route path for Next.js proxy
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000'; // fallback for SSR
      Datasource.instance = new Datasource(baseUrl);
    }

    return Datasource.instance;
  }

  public setBaseUrl(_url: string) {
    // Instead of setting the ERP URL, we set the Next.js API route
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'; // fallback for SSR
    this.client.setBaseUrl(baseUrl);
  }

  public setToken(token: string) {
    this.client.setAuthHeader(token, "Bearer");
  }

  public registerInterceptor(interceptor: Interceptor) {
    return this.client.registerInterceptor(interceptor);
  }

  public get(entity: string, options: Record<string, unknown> = {}) {
    try {
      // Post to the Next.js API route with entity and params
      return this.client.post('/api/datasource', {
        entity,
        params: this.buildParams(options)
      });
    } catch (error) {
      console.error(`Error fetching from datasource for entity ${entity}: ${error}`);

      throw error;
    }
  }

  private buildParams(options: DatasourceParams) {
    const params: Record<string, any> = {
      _noCount: "true",
      _operationType: "fetch",
      isImplicitFilterApplied: options.isImplicitFilterApplied ? "true" : "false",
    };

    if (options.windowId) {
      params.windowId = options.windowId;
    }

    if (options.tabId) {
      params.tabId = options.tabId;
    }

    for (const [key, value] of Object.entries(options)) {
      if (typeof value !== "undefined") {
        if (key === "criteria" && Array.isArray(value)) {
          params[key] = value.map(criteria => JSON.stringify(criteria));
        } else {
          const formattedKey = isWrappedWithAt(key) ? key : `_${key}`;
          params[formattedKey] = Array.isArray(value) ? value.join(",") : String(value);
        }
      }
    }

    return params;
  }
}

export const datasource = Datasource.getInstance();
