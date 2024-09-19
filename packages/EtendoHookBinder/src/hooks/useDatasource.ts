import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions } from '../api/types';
import { Datasource } from '../api/datasource';

const mapById = (
  acum: { [x: string]: unknown },
  current: { id: string | number },
) => {
  acum[current.id] = current;
  return acum;
};

const loadData = async (
  entity: string | undefined,
  tabId: string | undefined,
  page: number,
  pageSize: number,
  _params: string,
) => {
  if (!entity || !tabId) {
    console.warn('Missing required parameters for loadData:', {
      entity,
      tabId,
    });
    return { data: [], error: null };
  }

  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  try {
    const { response } = await Datasource.get(entity, undefined, tabId, {
      ...JSON.parse(_params),
      startRow,
      endRow,
    });

    return response;
  } catch (error) {
    return { data: [], error };
  }
};

export function useDatasource(
  windowMetadata:
    | { tabs: { entityName: string; id: string }[] }
    | null
    | undefined,
  params: DatasourceOptions,
) {
  const _params = JSON.stringify(params);
  const entity = windowMetadata?.tabs?.[0]?.entityName;
  const tabId = windowMetadata?.tabs?.[0]?.id;

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Record<string, Record<string, unknown>>>({});
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    console.log('useDatasource load called with:', {
      entity,
      tabId,
      _params,
    });

    if (!entity || !tabId) {
      console.warn('Missing required parameters for useDatasource');
      setLoading(false);
      setLoaded(true);
      setError(null);
      setData({});
      setRecords([]);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await loadData(entity, tabId, page, pageSize, _params);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        console.log('Processing response data:', response.data);
        const _data = (response.data || []).reduce(mapById, {});
        setData(prev => ({ ...prev, ..._data }));
        setLoaded(true);
      }
    } catch (error) {
      console.error('Error in useDatasource load:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
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

  useEffect(() => {
    const newRecords = Object.values(data);
    console.log('Updating records:', newRecords);
    setRecords(newRecords);
  }, [data]);

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
