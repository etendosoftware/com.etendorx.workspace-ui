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

// packages/MainUI/hooks/useLocation.ts
import { useCallback, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CreateLocationRequest, LocationResponse } from "@workspaceui/api-client/src/api/types";

export interface UseLocationResult {
  createLocation: (locationData: CreateLocationRequest) => Promise<LocationResponse>;
  loading: boolean;
  error: string | null;
}

export const useLocation = (): UseLocationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLocation = useCallback(async (locationData: CreateLocationRequest): Promise<LocationResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await Metadata.locationClient.createLocation(locationData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createLocation,
    loading,
    error,
  };
};
