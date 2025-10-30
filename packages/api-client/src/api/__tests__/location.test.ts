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

import { LocationClient } from "../location";
import type { CreateLocationRequest, LocationApiResponse } from "../types";

describe("LocationClient", () => {
  let client: LocationClient;
  const mockData: CreateLocationRequest = { address1: "123 Main St", city: "New York", countryId: "USA" };

  beforeEach(() => {
    client = new LocationClient();
  });

  describe("createLocation", () => {
    it("creates location successfully", async () => {
      const mockResponse = {
        data: { success: true, data: { id: "loc-123", _identifier: "LOC-123", ...mockData } },
      } as Response & { data: LocationApiResponse };

      jest.spyOn(client, "post").mockResolvedValue(mockResponse);

      const result = await client.createLocation(mockData);

      expect(client.post).toHaveBeenCalledWith("location/create", mockData);
      expect(result).toEqual(mockResponse.data.data);
    });

    it.each([
      [{ success: false, error: "Invalid address" }, "Invalid address"],
      [{ success: false }, "Error creating location"],
    ])("throws error on failure: %o", async (errorResponse, expectedMessage) => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      jest.spyOn(client, "post").mockResolvedValue({ data: errorResponse } as any);

      await expect(client.createLocation(mockData)).rejects.toThrow(expectedMessage);
      spy.mockRestore();
    });

    it("handles network errors", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      jest.spyOn(client, "post").mockRejectedValue(new Error("Network error"));

      await expect(client.createLocation(mockData)).rejects.toThrow("Network error");
      spy.mockRestore();
    });
  });

  describe("getLocationIdentifier", () => {
    it("gets identifier successfully", async () => {
      jest.spyOn(client, "post").mockResolvedValue({ data: { identifier: "LOC-001" } } as any);

      expect(await client.getLocationIdentifier("loc-123")).toBe("LOC-001");
      expect(client.post).toHaveBeenCalledWith("location/identifier", { locationId: "loc-123" });
    });

    it("handles errors", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      jest.spyOn(client, "post").mockRejectedValue(new Error("Not found"));

      await expect(client.getLocationIdentifier("loc-123")).rejects.toThrow("Not found");
      spy.mockRestore();
    });
  });
});
