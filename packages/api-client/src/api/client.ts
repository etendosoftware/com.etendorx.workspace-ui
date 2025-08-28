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

import { AUTH_HEADER_NAME } from "./constants";
import { getDecodedJsonResponse } from "./utils";

export interface ClientOptions extends Omit<RequestInit, "body"> {
  headers?: Record<string, string>;
  body?: RequestInit["body"] | Record<string, unknown>;
}

export type Interceptor = (response: Response) => Promise<Response> | Response;

export class UnauthorizedError extends Error {
  public response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
  }
}

export class Client {
  private baseHeaders: HeadersInit;
  private baseQueryParams: URLSearchParams;
  private baseUrl: string;
  private interceptor: Interceptor | null;
  private readonly JSON_CONTENT_TYPE = "application/json";
  private readonly FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
  private static abortControllers = new Map<string, AbortController>();

  constructor(url?: string) {
    this.baseUrl = url || "";
    this.baseHeaders = {};
    this.interceptor = null;
    this.baseQueryParams = new URLSearchParams();
  }

  public getAuthHeader(): string | undefined {
    return (this.baseHeaders as Record<string, string>)[AUTH_HEADER_NAME];
  }

  public setBaseUrl(url: string) {
    if (url) {
      this.baseUrl = url;
    } else {
      this.baseUrl = "";
    }
  }

  private cleanUrl(url: string) {
    let cleaned = url.startsWith("/") ? url.substring(1) : url;
    cleaned = cleaned.endsWith("/") ? cleaned.slice(0, -1) : cleaned;
    return cleaned;
  }

  private getFormattedBody(body: ClientOptions["body"]): RequestInit["body"] {
    if (typeof body === "string" || body instanceof URLSearchParams || body instanceof FormData) {
      return body;
    }
    if (body) {
      return JSON.stringify(body);
    }
    return undefined;
  }

  private isJson(response: Response) {
    return response.headers.get("Content-Type")?.includes("application/json") ?? false;
  }

  private setContentType(options: ClientOptions) {
    const { headers = {}, body } = options;

    if (!headers["Content-Type"]) {
      headers["Content-Type"] =
        body instanceof URLSearchParams || typeof body === "string" || body instanceof FormData
          ? this.FORM_CONTENT_TYPE
          : this.JSON_CONTENT_TYPE;
    }

    options.headers = headers;
  }

  public setAuthHeader(header: string, type: "Basic" | "Bearer" = "Basic") {
    this.baseHeaders = {
      ...this.baseHeaders,
      [AUTH_HEADER_NAME]: `${type} ${header}`,
    };

    return this;
  }

  public setLanguageHeader(value: string) {
    this.baseQueryParams.set("language", value);

    return this;
  }

  public addQueryParam(key: string, value: string) {
    this.baseQueryParams.set(key, value);

    return this;
  }

  public async request(url: string, options: ClientOptions = {}) {
    const requestId = `${url}-${Date.now()}`;
    const controller = new AbortController();

    try {
      // Registrar el controller para poder cancelar la request
      Client.abortControllers.set(requestId, controller);

      if (options.method !== "GET") {
        this.setContentType(options);
      }

      options.credentials = "include";

      // Handle query strings, empty strings and paths differently
      let rawUrl: string;
      if (url.startsWith("api/")) {
        rawUrl = `/${this.cleanUrl(url)}`;
      } else if (url.startsWith("?")) {
        // Query string - append directly to baseUrl without adding slash
        rawUrl = `${this.baseUrl}${url}`;
      } else if (url === "") {
        // Empty string - use baseUrl as-is
        rawUrl = this.baseUrl;
      } else {
        rawUrl = `${this.baseUrl}/${this.cleanUrl(url)}`;
      }
      const destination = new URL(rawUrl, window.location.origin);
      this.baseQueryParams.forEach((value, key) => destination.searchParams.append(key, value));

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      let response: Response & { data?: any } = await fetch(destination, {
        ...options,
        signal: controller.signal,
        credentials: "include",
        body: this.getFormattedBody(options.body),
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
      });

      if (typeof this.interceptor === "function") {
        response = await this.interceptor(response);
      }

      response.data = await (this.isJson(response) ? getDecodedJsonResponse(response) : response.text());

      return response;
    } catch (error) {
      // Si la request fue cancelada, no procesar como error
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request cancelled");
      }

      console.warn("API client request failed", {
        url,
        options,
        error: (error as Error).message,
      });

      throw error;
    } finally {
      // Limpiar el controller
      Client.abortControllers.delete(requestId);
    }
  }

  public registerInterceptor(interceptor: Interceptor) {
    this.interceptor = interceptor;

    return () => {
      this.interceptor = null;
    };
  }

  public async post(url: string, payload: ClientOptions["body"] = null, options: ClientOptions = {}) {
    return this.request(url, { ...options, body: payload, method: "POST" });
  }

  public run(js: string) {
    const script = document.createElement("script");

    script.type = "text/javascript";
    script.textContent = js;
    document.head.appendChild(script);
    document.head.removeChild(script);
  }

  // Método para cancelar todas las requests pendientes
  public static cancelAllRequests(): void {
    Client.abortControllers.forEach((controller) => {
      controller.abort();
    });
    Client.abortControllers.clear();
  }

  // Método para cancelar requests específicas
  public static cancelRequestsForEndpoint(endpoint: string): void {
    Array.from(Client.abortControllers.entries())
      .filter(([key]) => key.startsWith(endpoint))
      .forEach(([key, controller]) => {
        controller.abort();
        Client.abortControllers.delete(key);
      });
  }
}
