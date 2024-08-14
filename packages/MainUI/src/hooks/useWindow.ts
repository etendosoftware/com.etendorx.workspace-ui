import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';
import { UnauthorizedError } from '@workspaceui/etendohookbinder/src/api/client';
import { useMetadataContext } from './useMetadataContext';
import { parseColumns } from '../helpers/metadata';
import { useNavigate } from 'react-router-dom';

export function useWindow(windowId: string) {
  const navigate = useNavigate();
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

        setWindowData(_windowData);
        setColumnsData(
          parseColumns(getColumns(_windowData.properties.viewProperties.tabId)),
        );
        setLoaded(true);
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          navigate({ pathname: '/login' });
        }

        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return _load();
  }, [getColumns, getWindow, navigate, windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, windowData, columnsData, error, loaded, load }),
    [columnsData, error, load, loaded, loading, windowData],
  );
}
