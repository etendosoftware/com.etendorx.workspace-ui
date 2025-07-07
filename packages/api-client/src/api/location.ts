import { Client } from "./client";

export interface CreateLocationRequest {
  address1: string;
  address2?: string;
  postal?: string;
  city: string;
  countryId: string;
  regionId?: string;
}

export interface LocationResponse {
  id: string;
  _identifier: string;
  address1: string;
  address2?: string;
  postal?: string;
  city: string;
  countryId: string;
  regionId?: string;
}

export interface LocationApiResponse {
  success: boolean;
  data: LocationResponse;
}

export interface LocationErrorResponse {
  success: false;
  error: string;
  status: number;
}

export class LocationClient extends Client {
  /**
   * Crea una nueva dirección
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
   * Obtiene el identifier de una dirección existente
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
