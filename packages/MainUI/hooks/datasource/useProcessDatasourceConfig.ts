import { useCallback, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { logger } from '@/utils/logger';

interface ProcessConfigResponse {
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
 * Hook para obtener la configuración de un proceso
 * utilizando DefaultsProcessActionHandler
 */
export const useProcessConfig = ({ processId, windowId, tabId }: UseProcessConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<ProcessConfigResponse | null>(null);

  const fetchConfig = useCallback(
    async (payload: Record<string, any> = {}) => {
      if (!processId || !windowId || !tabId) {
        return null;
      }

      const params = new URLSearchParams({
        processId,
        windowId,
        _action: 'org.openbravo.client.application.process.DefaultsProcessActionHandler',
      });

      const basePayload = {
        inpissotrx: 'Y',
        inpadOrgId: '7BABA5FF80494CAFA54DEBD22EC46F01',
        ...payload,
      };

      try {
        setLoading(true);
        setError(null);

        logger.debug(`Fetching process config for process ${processId}`, basePayload);
        const { data } = await Metadata.kernelClient.post(`?${params}`, basePayload);
        logger.debug(`Process config response for process ${processId}:`, data);

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
