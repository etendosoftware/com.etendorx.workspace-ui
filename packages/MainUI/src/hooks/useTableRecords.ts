import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatasourceOptions,
  Tab,
} from '@workspaceui/etendohookbinder/src/api/types';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useRecordContext } from './useRecordContext';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

const mapById = (
  acum: { [x: string]: unknown },
  current: { id: string | number },
) => {
  acum[current.id] = current;

  return acum;
};

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

export function useTableRecords(tab: Tab, params?: DatasourceOptions) {
  const _params = JSON.stringify(params ?? {});
  const entity = tab?.entityName;
  const tabId = tab?.id;
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Record<string, Record<string, unknown>>>({});
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
        const _data = response.data.reduce(mapById, {});

        setData(prev => ({ ...prev, ..._data }));
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
    setRecords(Object.values(data));
    setLoading(false);
  }, [data]);

  useEffect(() => {
    setData({});
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      loading,
      data,
      error,
      fetchMore,
      changePageSize,
      load,
      records,
      loaded,
    }),
    [data, error, loading, fetchMore, changePageSize, load, records, loaded],
  );
}
