import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Etendo } from '../api/metadata';
import { useMetadataContext } from '../hooks/useMetadataContext';

export function useWindow(windowId: string) {
  const { getWindow } = useMetadataContext();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      setWindowData(await getWindow(windowId));
      setLoaded(true);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [getWindow, windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, windowData, error, loaded, load }),
    [error, load, loaded, loading, windowData],
  );
}
