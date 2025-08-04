import { useCallback, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";

export interface ProcessConfigResponse {
  processId: string;
  defaults?: Record<string, { value: string; identifier: string }>;
  filterExpressions?: Record<string, Record<string, string>>;
  refreshParent?: boolean;
}

interface UseProcessConfigProps {
  processId: string;
  windowId: string;
  tabId: string;
  javaClassName?: string;
}

/**
 * Hook to obtain the configuration for process execution
 * @param processId - ID of the process
 * @param windowId - ID of the window
 * @param tabId - ID of the tab
 * @param javaClassName - Java class name for the process action (optional, defaults to DefaultsProcessActionHandler)
 * @returns Object with functions to handle the configuration of the process
 */
export const useProcessConfig = ({ processId, windowId, tabId, javaClassName }: UseProcessConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<ProcessConfigResponse | null>(null);

  const fetchConfig = useCallback(
    async (payload: Record<string, EntityValue> = {}) => {
      if (!processId || !windowId || !tabId) {
        return null;
      }

      const params = new URLSearchParams({
        processId,
        windowId,
        _action: javaClassName || "org.openbravo.client.application.process.DefaultsProcessActionHandler",
      });

      const requestPayload = { ...payload };

      try {
        setLoading(true);
        setError(null);

        const { data } = await Metadata.kernelClient.post(`?${params}`, requestPayload);

        const processedConfig: ProcessConfigResponse = {
          processId,
          defaults: data?.defaults || {},
          filterExpressions: data?.filterExpressions || {},
          refreshParent: !!data?.refreshParent,
        };

        setConfig(processedConfig);
        return processedConfig;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error fetching process config";

        logger.error(`Error fetching process config for process ${processId}:`, err);
        setError(new Error(errorMessage));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [processId, windowId, tabId, javaClassName]
  );

  return {
    fetchConfig,
    loading,
    error,
    config,
  };
};
