import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { logger } from '@/utils/logger';

export function useWindow(windowId: string) {
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);
  const [windowData, setWindowData] = useState(Metadata.getCachedWindow(windowId));

  const load = useCallback(async () => {
    try {
      if (!windowId) {
        return;
      }

      setLoading(true);
      setError(undefined);

      const data = await Metadata.getWindow(windowId);

      setWindowData(data);
      setLoaded(true);
    } catch (e) {
      logger.warn(e);

      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, windowData, error, loaded, load }),
    [error, load, loaded, loading, windowData],
  );
}
