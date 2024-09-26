import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Etendo } from '../api/metadata';
import { useMetadataContext } from '../hooks/useMetadataContext';
import { Column } from '../api/types';

export function useWindow(windowId: string) {
  const { getWindow, getColumns } = useMetadataContext();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const columnsData = useMemo(() => {
    const cols: Record<string, Column[]> = {};

    if (windowData?.tabs?.length) {
      windowData.tabs.forEach(tab => {
        cols[tab.id] = getColumns(tab.id);
      });
    }

    return cols;
  }, [getColumns, windowData]);

  const load = useCallback(async () => {
    try {
      if (!windowId) {
        return;
      }

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
    () => ({ loading, windowData, error, loaded, load, columnsData }),
    [columnsData, error, load, loaded, loading, windowData],
  );
}
