import { useCallback, useEffect, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { ToolbarResponse } from './types';

export function useToolbar(windowId: string, tabId?: string) {
  const [toolbar, setToolbar] = useState<ToolbarResponse | null>(null);
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error | null>(null);

  const fetchToolbar = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(null);

      const url = tabId ? `toolbar/${windowId}/${tabId}` : `toolbar/${windowId}`;
      const response = await Metadata.client.post(url);

      setToolbar(response.data);
    } catch (error) {
      console.error('Error fetching toolbar:', error);
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
