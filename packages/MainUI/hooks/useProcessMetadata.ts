import { ProcessButton } from '@/components/ProcessModal/types';
import { ProcessBindings } from '@workspaceui/etendohookbinder/src/api/types';
import { useState, useEffect, useCallback } from 'react';

export interface ProcessMetadata {
  metadata: ProcessBindings;
  loading: boolean;
  error: string | null;
}

export const useProcessMetadata = (processButton?: ProcessButton | null): ProcessMetadata => {
  const [metadata, setMetadata] = useState<ProcessBindings>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(
    async (controller: AbortController) => {
      if (!processButton) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { onProcess, onLoad, metadata } = await import(`../process/${processButton.processInfo.searchKey}`);

        if (!controller.signal.aborted) {
          setMetadata({ onProcess, onLoad, metadata });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Failed to load process metadata: ' + (err as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [processButton],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadata(controller);

    return () => {
      controller.abort();
    };
  }, [fetchMetadata]);

  return { metadata, loading, error };
};
