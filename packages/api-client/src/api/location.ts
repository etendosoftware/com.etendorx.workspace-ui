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
