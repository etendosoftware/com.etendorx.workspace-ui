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

import { useState, useCallback } from "react";
import { Client } from "@workspaceui/api-client/src/api/client";
import type { ClientOptions } from "@workspaceui/api-client/src/api/client";

interface UseApiRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (endpoint: string, options?: ClientOptions) => Promise<T | null>;
  cancel: () => void;
}

export const useApiRequest = <T>(): UseApiRequestResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const execute = useCallback(async (endpoint: string, options?: ClientOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setCurrentEndpoint(endpoint);

    try {
      const client = new Client();
      const response = await client.request(endpoint, options);

      if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
      }

      setData(response.data);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);

      // If it's an authentication error, don't show the error since logout will occur
      if (errorMessage.includes("login again")) {
        return null;
      }

      console.error("API Request failed:", err);
      return null;
    } finally {
      setLoading(false);
      setCurrentEndpoint(null);
    }
  }, []);

  const cancel = useCallback(() => {
    if (currentEndpoint) {
      Client.cancelRequestsForEndpoint(currentEndpoint);
      setLoading(false);
    }
  }, [currentEndpoint]);

  return { data, loading, error, execute, cancel };
};
