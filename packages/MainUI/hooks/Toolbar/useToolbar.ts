import { useCallback, useEffect, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { ToolbarResponse } from './types';
import { logger } from '@/utils/logger';

export function useToolbar(windowId: string, tabId?: string) {
  const [toolbar, setToolbar] = useState<ToolbarResponse | null>(null);
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error | null>(null);

  const fetchToolbar = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('_operationType', 'fetch');
      params.append('_startRow', '0');
      params.append('_endRow', '75');
      // params.append(
      //   'criteria',
      //   JSON.stringify({
      //     // Create a criteria that returns every recoord when tab id null and filter the records by tabId when it has one
      //   }),
      // );

      const url = tabId ? 'etmeta_Toolbar' : `toolbar/${windowId}`;

      const response = await Metadata.datasourceServletClient.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      setToolbar(response.data);
    } catch (error) {
      logger.warn(error);

      setError(error instanceof Error ? error : new Error('Failed to fetch toolbar'));
    } finally {
      setLoading(false);
    }
  }, [windowId, tabId]);

  useEffect(() => {
    if (windowId) {
      fetchToolbar();
    }
  }, [fetchToolbar, windowId]);

  return {
    toolbar,
    loading,
    error,
    refetch: fetchToolbar,
  };
}
