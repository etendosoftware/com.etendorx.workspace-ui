import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions } from '../api/types';
import { Datasource } from '../api/datasource';

const loadData = async (
  entity: string,
  page: number,
  pageSize: number,
  _params: string,
) => {
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const { response } = await Datasource.get(entity, {
    ...JSON.parse(_params),
    startRow,
    endRow,
  });

  return response;
};

export function useDatasource(entity: string, params?: DatasourceOptions) {
  const _params = JSON.stringify(params ?? {});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    try {
      if (!entity) {
        return;
      }

      setError(undefined);
      setLoading(true);

      const response = await loadData(entity, page, pageSize, _params);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        const newRecords = response.data;
        setRecords(prevRecords => {
          const recordSet = new Set(prevRecords.map(r => r.id));
          const uniqueNewRecords = newRecords.filter(
            (r: { id: unknown }) => !recordSet.has(r.id),
          );
          return [...prevRecords, ...uniqueNewRecords];
        });
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [_params, entity, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

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
