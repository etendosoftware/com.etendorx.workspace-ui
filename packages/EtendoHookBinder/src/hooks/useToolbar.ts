import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';
import { ToolbarMetadata } from '../api/types';

export function useToolbar(windowId: string, tabId?: string) {
  const [toolbar, setToolbar] = useState<ToolbarMetadata>();
  const [loading, setLoading] = useState(true);

  const fetchToolbar = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      const url = tabId ? `toolbar/${windowId}/${tabId}` : `toolbar/${windowId}`;
      const response = await Metadata.client.post(url);
      setToolbar(response.data);
    } catch (error) {
      console.error('Error fetching toolbar:', error);
    } finally {
      setLoading(false);
    }
  }, [windowId, tabId]);

  useEffect(() => {
    fetchToolbar();
  }, [fetchToolbar]);

  return useMemo(
    () => ({
      toolbar,
      loading,
    }),
    [toolbar, loading],
  );
}
