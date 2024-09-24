import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, Tab } from '../api/types';
import { Datasource } from '../api/datasource';

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

  console.debug({ entity, tabId, _params });
  const { response } = await Datasource.get(entity, tabId, {
    ...JSON.parse(_params),
    startRow,
    endRow,
  });

  return response;
};

export function useDatasource(tab: Tab, params?: DatasourceOptions) {
  const _params = JSON.stringify(params ?? {});
  const entity = tab?.entityName;
  const tabId = tab?.id;
  const [loading, setLoading] = useState(true);
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
    if (params?.criteria) {
      setData({});
    }
  }, [params?.criteria]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setRecords(Object.values(data));
    setLoading(false);
  }, [data]);

  useEffect(() => {
    setData({});
  }, [entity]);

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
