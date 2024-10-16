import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';

export function useWindow(windowId: string) {
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);
  const [windowData, setWindowData] = useState(Metadata.getCachedWindow(windowId));
  const [columnsData, setColumnsData] = useState(Metadata.getTabsColumns(windowData?.tabs));

  const load = useCallback(async () => {
    try {
      if (!windowId) {
        return;
      }

      setLoading(true);
      setError(undefined);

      const data = await Metadata.getWindow(windowId);

      setWindowData(data);
      setColumnsData(Metadata.getTabsColumns(data.tabs));
      setLoaded(true);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, windowData, error, loaded, load, columnsData }),
    [columnsData, error, load, loaded, loading, windowData],
  );
}
