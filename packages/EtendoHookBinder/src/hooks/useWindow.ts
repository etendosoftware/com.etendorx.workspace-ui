import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata, type Etendo } from '../api/metadata';
import { Column } from '../api/types';

export function useWindow(windowId: string) {
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata>();
  const [loading, setLoading] = useState(!!windowId);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const columnsData = useMemo(() => {
    const cols: Record<string, Column[]> = {};

    if (windowData?.tabs?.length) {
      windowData.tabs.forEach(tab => {
        cols[tab.id] = Metadata.getColumns(tab.id);
      });
    }

    return cols;
  }, [windowData?.tabs]);

  const load = useCallback(async () => {
    try {
      if (!windowId) {
        return;
      }

      setLoading(true);
      setError(undefined);
      setWindowData(await Metadata.getWindow(windowId));
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
