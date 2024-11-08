import { useCallback, useEffect, useState } from 'react';
import { Metadata } from '../api/metadata';

interface ToolbarResponse {
  response: {
    response: {
      buttons: Array<{
        id: string;
        name: string;
        action: string;
        enabled: boolean;
        visible: boolean;
        icon: string;
      }>;
      windowId: string;
      isNew: boolean;
    };
  };
}

export function useToolbar(windowId: string, tabId?: string) {
  const [toolbar, setToolbar] = useState<ToolbarResponse | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchToolbar();
  }, [fetchToolbar]);

  return {
    toolbar,
    loading,
    error,
    refetch: fetchToolbar,
  };
}
