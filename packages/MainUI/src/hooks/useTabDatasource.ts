import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatasourceOptions,
  Tab,
} from '@workspaceui/etendohookbinder/src/api/types';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';

const loadData = async (
  entity: string,
  tabId: string,
  page: number,
  pageSize: number,
  _params: string,
) => {
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const { response } = await Datasource.get(entity, tabId, {
    ...JSON.parse(_params),
    startRow,
    endRow,
  });

  return response;
};

export function useTabDatasource(tab: Tab, params?: DatasourceOptions) {
  const _params = JSON.stringify(params ?? {});
  const entity = tab?.entityName;
  const tabId = tab?.id;
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    try {
      if (!entity || !tabId) {
        return;
      }

      setError(undefined);
      setLoading(true);

      const response = await loadData(entity, tabId, page, pageSize, _params);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        setRecords(prev => prev.concat(response.data));
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    }
  }, [_params, entity, page, pageSize, tabId]);

  const fetchMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      loading,
      error,
      fetchMore,
      changePageSize,
      load,
      records,
      loaded,
    }),
    [error, loading, fetchMore, changePageSize, load, records, loaded],
  );
}
