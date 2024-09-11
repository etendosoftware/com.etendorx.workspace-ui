import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Etendo } from '../api/metadata';
import { useMetadataContext } from '../hooks/useMetadataContext';
import { parseColumns } from '../helpers/metadata';

export function useWindow(windowId: string) {
  const { getWindow, getColumns } = useMetadataContext();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata>();
  const [columnsData, setColumnsData] = useState<Etendo.Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const _load = async () => {
      try {
        setLoading(true);
        setError(undefined);

        const _windowData = await getWindow(windowId);
        console.debug(_windowData)

        setWindowData(_windowData);
        setColumnsData(
          parseColumns(getColumns(_windowData.properties.viewProperties.tabId)),
        );
        setLoaded(true);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return _load();
  }, [getColumns, getWindow, windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, windowData, columnsData, error, loaded, load }),
    [columnsData, error, load, loaded, loading, windowData],
  );
}
