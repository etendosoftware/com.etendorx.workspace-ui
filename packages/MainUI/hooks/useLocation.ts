// packages/MainUI/hooks/useLocation.ts
import { useCallback, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { CreateLocationRequest, LocationResponse } from "@workspaceui/api-client/src/api/location";

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
