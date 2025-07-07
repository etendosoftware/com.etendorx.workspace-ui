import { Client } from "./client";
import type { CreateLocationRequest, LocationResponse, LocationApiResponse, LocationErrorResponse } from "./types";

export class LocationClient extends Client {
  /**
   * Create a new address
   */
  public async createLocation(locationData: CreateLocationRequest): Promise<LocationResponse> {
    try {
      const { data } = await this.post<LocationApiResponse>("/location/create", locationData);

      if (!data.success) {
        throw new Error((data as LocationErrorResponse).error || "Error creating location");
      }

      return data.data;
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  }

  /**
   * Get an identifier of an existent location
   */
  public async getLocationIdentifier(locationId: string): Promise<string> {
    try {
      const { data } = await this.post<{ identifier: string }>("/location/identifier", { locationId });
      return data.identifier;
    } catch (error) {
      console.error("Error getting location identifier:", error);
      throw error;
    }
  }
}

export const locationClient = new LocationClient();
