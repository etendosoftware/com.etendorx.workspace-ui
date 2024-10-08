import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions } from '../api/types';
import { Datasource } from '../api/datasource';

const loadData = async (entity: string, page: number, pageSize: number, params: DatasourceOptions) => {
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const { response } = await Datasource.get(entity, {
    ...params,
    startRow,
    endRow,
  });

  return response;
};

const defaultParams = {};

export function useDatasource(entity: string, params: DatasourceOptions = defaultParams) {
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

      const response = await loadData(entity, page, pageSize, params);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        const newRecords = response.data;
        setRecords(prevRecords => {
          const result = prevRecords.concat(newRecords).reduce((result, current) => {
            result[current.id as string] = current;

            return result;
          }, {});

          return Object.values(result) as typeof prevRecords;
        });
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [params, entity, page, pageSize]);

  const fetchMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  useEffect(() => {
    setRecords([]);
    setLoaded(false);
  }, [entity, params]);

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
