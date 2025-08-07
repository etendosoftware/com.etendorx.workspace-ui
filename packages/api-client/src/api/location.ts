import { Client } from "./client";
import type { CreateLocationRequest, LocationResponse, LocationApiResponse, LocationErrorResponse } from "./types";

export class LocationClient extends Client {
  /**
   * Create a new address
   */
  public async createLocation(locationData: CreateLocationRequest): Promise<LocationResponse> {
    try {
      const response = await this.post("location/create", locationData);
      const data = response.data as LocationApiResponse;

      if (!data.success) {
        const errorData = data as unknown as LocationErrorResponse;
        throw new Error(errorData.error || "Error creating location");
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
      const response = await this.post("location/identifier", { locationId });
      const data = response.data as { identifier: string };
      return data.identifier;
    } catch (error) {
      console.error("Error getting location identifier:", error);
      throw error;
    }
  }
}

export const locationClient = new LocationClient();
