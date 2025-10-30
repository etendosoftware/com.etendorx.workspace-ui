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
import type { CreateLocationRequest, LocationResponse, LocationApiResponse } from "../types";

describe("LocationClient", () => {
  let locationClient: LocationClient;

  beforeEach(() => {
    locationClient = new LocationClient();
  });

  describe("createLocation", () => {
    it("should create a location successfully", async () => {
      const mockLocationData: CreateLocationRequest = {
        address1: "123 Main St",
        city: "New York",
        countryId: "USA",
      };

      const mockResponse: LocationApiResponse = {
        success: true,
        data: {
          id: "location-123",
          _identifier: "LOC-123",
          address1: "123 Main St",
          city: "New York",
          countryId: "USA",
        },
      };

      const mockFetchResponse = {
        data: mockResponse,
      } as Response & { data: LocationApiResponse };

      jest.spyOn(locationClient, "post").mockResolvedValue(mockFetchResponse);

      const result = await locationClient.createLocation(mockLocationData);

      expect(locationClient.post).toHaveBeenCalledWith("location/create", mockLocationData);
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw error when location creation fails", async () => {
      const mockLocationData: CreateLocationRequest = {
        address1: "123 Main St",
        city: "New York",
        countryId: "USA",
      };

      const mockErrorResponse = {
        success: false,
        error: "Invalid address",
      };

      const mockFetchResponse = {
        data: mockErrorResponse,
      } as Response & { data: typeof mockErrorResponse };

      jest.spyOn(locationClient, "post").mockResolvedValue(mockFetchResponse);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(locationClient.createLocation(mockLocationData)).rejects.toThrow("Invalid address");

      consoleErrorSpy.mockRestore();
    });

    it("should throw default error message when no error message provided", async () => {
      const mockLocationData: CreateLocationRequest = {
        address1: "123 Main St",
        city: "New York",
        countryId: "USA",
      };

      const mockErrorResponse = {
        success: false,
      };

      const mockFetchResponse = {
        data: mockErrorResponse,
      } as Response & { data: typeof mockErrorResponse };

      jest.spyOn(locationClient, "post").mockResolvedValue(mockFetchResponse);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(locationClient.createLocation(mockLocationData)).rejects.toThrow("Error creating location");

      consoleErrorSpy.mockRestore();
    });

    it("should handle network errors", async () => {
      const mockLocationData: CreateLocationRequest = {
        address1: "123 Main St",
        city: "New York",
        countryId: "USA",
      };

      jest.spyOn(locationClient, "post").mockRejectedValue(new Error("Network error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(locationClient.createLocation(mockLocationData)).rejects.toThrow("Network error");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getLocationIdentifier", () => {
    it("should get location identifier successfully", async () => {
      const locationId = "location-123";
      const mockResponse = {
        identifier: "LOC-001",
      };

      const mockFetchResponse = {
        data: mockResponse,
      } as Response & { data: typeof mockResponse };

      jest.spyOn(locationClient, "post").mockResolvedValue(mockFetchResponse);

      const result = await locationClient.getLocationIdentifier(locationId);

      expect(locationClient.post).toHaveBeenCalledWith("location/identifier", { locationId });
      expect(result).toBe("LOC-001");
    });

    it("should handle errors when getting location identifier", async () => {
      const locationId = "location-123";

      jest.spyOn(locationClient, "post").mockRejectedValue(new Error("Location not found"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(locationClient.getLocationIdentifier(locationId)).rejects.toThrow("Location not found");

      consoleErrorSpy.mockRestore();
    });
  });
});
