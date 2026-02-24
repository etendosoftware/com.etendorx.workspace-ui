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

import { Client } from "../client";

describe("Client", () => {
  const originalWindow = global.window as any;
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Ensure WHATWG URL is available in test environment
    const nodeUrl = require("url");
    (global as any).URL = nodeUrl.URL;
    (global as any).URLSearchParams = nodeUrl.URLSearchParams;
    // Do not replace the whole window object to keep JSDOM globals like FormData
    if ((global as any).window) {
      Object.defineProperty(global.window, "location", {
        value: { origin: "http://localhost:3000" },
        writable: true,
      });
    } else {
      (global as any).window = { location: { origin: "http://localhost:3000" } };
    }
  });

  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json; charset=utf-8" },
      json: async () => ({ success: true }),
      text: async () => '{"success":true}',
      arrayBuffer: async () => new TextEncoder().encode('{"success":true}').buffer,
    });
  });

  afterAll(() => {
    (global as any).window = originalWindow;
    (global as any).fetch = originalFetch;
  });

  describe("URL building", () => {
    it("prefixes 'api/..' with '/' to avoid attaching to base", async () => {
      const client = new Client();
      client.setBaseUrl("http://localhost:3000/api/erp/meta/forward/org.openbravo.service.datasource/");

      await client.request("api/datasource");

      expect((global as any).fetch).toHaveBeenCalled();
      const url = (global as any).fetch.mock.calls[0][0].toString();
      // Should call app route, not forward base. We check for the path to be correct.
      expect(url).toContain("/api/datasource");
      expect(url).not.toContain("meta/forward");
    });

    it("handles empty string by using baseUrl", async () => {
      const client = new Client("http://localhost:3000/test");
      await client.request("");
      const url = (global as any).fetch.mock.calls[0][0].toString();
      expect(url).toBe("http://localhost:3000/test");
    });

    it("handles query strings starting with '?'", async () => {
      const client = new Client("http://base.com");
      await client.request("?param=1");
      const url = (global as any).fetch.mock.calls[0][0].toString();
      expect(url).toBe("http://base.com/?param=1");
    });
  });

  describe("Headers and Auth", () => {
    it("sets Auth header correctly", async () => {
      const client = new Client();
      client.setAuthHeader("my-token", "Bearer");
      await client.request("test");

      const options = (global as any).fetch.mock.calls[0][1];
      expect(options.headers["Authorization"]).toBe("Bearer my-token");
    });

    it("sets language query param", async () => {
      const client = new Client("http://base.com");
      client.setLanguageHeader("es_ES");
      await client.request("test");

      const url = (global as any).fetch.mock.calls[0][0].toString();
      expect(url).toContain("language=es_ES");
    });
  });

  describe("Interceptors", () => {
    it("should transform response using interceptor", async () => {
      const client = new Client();
      client.registerInterceptor(async (res) => {
        return { ...res, mocked: true } as any;
      });

      const response = await client.request("test");
      expect((response as any).mocked).toBe(true);
    });

    it("should allow unregistering interceptor", async () => {
      const client = new Client();
      const unregister = client.registerInterceptor((res) => res);
      unregister();

      const response = await client.request("test");
      expect((response as any).mocked).toBeUndefined();
    });
  });

  describe("Content-Type detection", () => {
    it("defaults to application/json for object bodies", async () => {
      const client = new Client();
      await client.post("test", { key: "value" });

      const options = (global as any).fetch.mock.calls[0][1];
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.body).toBe(JSON.stringify({ key: "value" }));
    });

    it("uses x-www-form-urlencoded for URLSearchParams", async () => {
      const client = new Client();
      const params = new URLSearchParams();
      params.append("a", "b");
      await client.post("test", params);

      const options = (global as any).fetch.mock.calls[0][1];
      expect(options.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    });
  });

  describe("Response decoding", () => {
    it("handles binary responses", async () => {
      const client = new Client();
      const mockBlob = new Blob(["test"]);
      (global as any).fetch.mockResolvedValue({
        ok: true,
        headers: { get: () => "application/pdf" },
        blob: async () => mockBlob,
      });

      const response = await client.request("test");
      expect(response.data).toBe(mockBlob);
    });
  });
});
