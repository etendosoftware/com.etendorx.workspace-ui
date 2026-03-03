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

import { Datasource } from "../datasource";
import type { Client } from "../client";

jest.mock("../client");

describe("api/datasource/Datasource", () => {
  let datasource: Datasource;
  let mockClient: jest.Mocked<Client>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance if necessary or just get instance
    datasource = Datasource.getInstance();
    datasource.clearCache();
    mockClient = datasource.client as jest.Mocked<Client>;
  });

  describe("getInstance", () => {
    it("returns the same instance", () => {
      const instance1 = Datasource.getInstance();
      const instance2 = Datasource.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("setBaseUrl", () => {
    it("calls client.setBaseUrl", () => {
      datasource.setBaseUrl("http://new-url.com");
      expect(mockClient.setBaseUrl).toHaveBeenCalled();
    });
  });

  describe("setToken", () => {
    it("calls client.setAuthHeader", () => {
      datasource.setToken("fake-token");
      expect(mockClient.setAuthHeader).toHaveBeenCalledWith("fake-token", "Bearer");
    });
  });

  describe("get", () => {
    it("deduplicates concurrent identical requests", async () => {
      mockClient.post.mockReturnValue(new Promise(() => {})); // Never resolves for this test

      const promise1 = datasource.get("Product", { id: "1" });
      const promise2 = datasource.get("Product", { id: "1" });

      expect(promise1).toBe(promise2);
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });

    it("fetches data and clears pending request on completion", async () => {
      const mockData = { ok: true, data: [] };
      mockClient.post.mockResolvedValue(mockData as any);

      const result = await datasource.get("Product", { id: "2" });

      expect(result).toBe(mockData);
      expect(mockClient.post).toHaveBeenCalledTimes(1);

      // Subsequent request should call post again because first one finished
      await datasource.get("Product", { id: "2" });
      expect(mockClient.post).toHaveBeenCalledTimes(2);
    });

    it("builds correct parameters including prefixes", async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: {} } as any);

      await datasource.get("Product", {
        startRow: 0,
        sortBy: "name",
        customParam: "val",
        isImplicitFilterApplied: true,
      });

      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe("/api/datasource");
      expect(callArgs[1]).toEqual({
        entity: "Product",
        params: {
          _noCount: "true",
          _operationType: "fetch",
          _startRow: "0",
          _sortBy: "name",
          customParam: "val",
          isImplicitFilterApplied: "true",
        },
      });
    });

    it("handles criteria correctly", async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: {} } as any);

      const criteria = [{ fieldName: "name", operator: "equals", value: "test" }];
      await datasource.get("Product", { criteria });

      expect(mockClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            criteria: [JSON.stringify(criteria[0])],
          }),
        })
      );
    });
  });

  describe("cache clearing", () => {
    it("clears all cache", () => {
      mockClient.post.mockReturnValue(new Promise(() => {}));
      datasource.get("A");
      datasource.clearCache();
      datasource.get("A");
      expect(mockClient.post).toHaveBeenCalledTimes(2);
    });

    it("clears cache for specific entity", async () => {
      mockClient.post.mockReturnValue(new Promise(() => {}));
      // Entity A
      datasource.get("A");
      // Entity B
      datasource.get("B");

      datasource.clearCacheForEntity("A");

      // A should be refetched
      mockClient.post.mockResolvedValue({ ok: true, data: {} } as any);
      await datasource.get("A");
      expect(mockClient.post).toHaveBeenCalledTimes(3);

      // B should still be pending (deduplicated)
      datasource.get("B");
      expect(mockClient.post).toHaveBeenCalledTimes(3);
    });
  });
});
