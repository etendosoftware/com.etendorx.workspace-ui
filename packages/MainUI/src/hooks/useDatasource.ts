import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatasourceParams,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';

export function useDatasource(
  windowMetadata: WindowMetadata,
  params: DatasourceParams,
) {
  const entity = windowMetadata?.properties.viewProperties.entity;
  const windowId = windowMetadata?.properties.windowId;
  const tabId = windowMetadata?.properties.viewProperties.tabId;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const _load = async () => {
      try {
        if (!entity || !windowId || !tabId) {
          return;
        }

        setLoading(true);
        setError(undefined);

        const { response } = await Datasource.get(
          entity,
          windowId,
          tabId,
          params,
        );

        if (response.error) {
          throw new Error(response.error.message);
        } else {
          setData(response.data);
        }
        setLoaded(true);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return _load();
  }, [entity, params, tabId, windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}
