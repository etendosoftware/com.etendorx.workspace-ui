import { useCallback, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { logger } from '@/utils/logger';
import { EntityValue } from '@workspaceui/etendohookbinder/src/api/types';

export interface ProcessConfigResponse {
  defaults?: Record<string, { value: string; identifier: string }>;
  filterExpressions?: Record<string, Record<string, string>>;
  refreshParent?: boolean;
}

interface UseProcessConfigProps {
  processId: string;
  windowId: string;
  tabId: string;
}

/**
 * Hook to obtain the configuration based on DefaultsProcessActionHandler
 * @param processId - ID of the process
 * @param windowId - ID of the window
 * @param tabId - ID of the tab
 * @returns Object with functions to handle the configuration of the process
 */
export const useProcessConfig = ({ processId, windowId, tabId }: UseProcessConfigProps) => {
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
        // TODO: Remove hardcoded value and use action provided by process metadata
        _action: 'org.openbravo.client.application.process.DefaultsProcessActionHandler',
      });

      const requestPayload = { ...payload };

      try {
        setLoading(true);
        setError(null);

        const { data } = await Metadata.kernelClient.post(`?${params}`, requestPayload);

        const processedConfig: ProcessConfigResponse = {
          defaults: data?.defaults || {},
          filterExpressions: data?.filterExpressions || {},
          refreshParent: !!data?.refreshParent,
        };

        setConfig(processedConfig);
        return processedConfig;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching process config';

        logger.error(`Error fetching process config for process ${processId}:`, err);
        setError(new Error(errorMessage));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [processId, windowId, tabId],
  );

  return {
    fetchConfig,
    loading,
    error,
    config,
  };
};
