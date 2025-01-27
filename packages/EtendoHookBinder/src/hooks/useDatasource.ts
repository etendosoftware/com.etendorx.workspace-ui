import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, Column } from '../api/types';
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

const defaultParams = {
  pageSize: 1000,
};

export function useDatasource(
  entity: string,
  params: DatasourceOptions = defaultParams,
  searchQuery?: string,
  columns?: Column[],
) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);

  const searchCriteria = useMemo(() => {
    if (!searchQuery || !columns) return [];

    const searchFields = columns
      .filter(column => column.name && !column.name.includes('.'))
      .map(column => ({
        fieldName: column.name,
        operator: 'iContains',
        value: searchQuery,
      }));

    if (searchFields.length > 0) {
      return [
        {
          fieldName: '_identifier',
          operator: 'iContains',
          value: searchQuery,
        },
      ];
    }

    return [];
  }, [searchQuery, columns]);

  const queryParams = useMemo(() => {
    const baseCriteria = params.criteria || [];
    const allCriteria = searchQuery ? [...baseCriteria, ...searchCriteria] : baseCriteria;

    return {
      ...params,
      criteria: allCriteria,
    };
  }, [params, searchCriteria, searchQuery]);

  const load = useCallback(async () => {
    try {
      if (!entity) {
        setLoaded(true);
        return;
      }

      setError(undefined);
      setLoading(true);

      const response = await loadData(entity, page, pageSize, queryParams);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        setRecords(prevRecords => {
          if (searchQuery || page === 1) {
            return response.data;
          }

          const mergedRecords = [...prevRecords, ...response.data];
          const uniqueRecords = mergedRecords.reduce((acc, current) => {
            acc[current.id as string] = current;
            return acc;
          }, {} as Record<string, unknown>);

          return Object.values(uniqueRecords);
        });
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [queryParams, entity, page, pageSize]);

  useEffect(() => {
    setRecords([]);
    setLoaded(false);
    setPage(1);
  }, [entity, searchQuery]);

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

  function fetchMore() {
    if (!searchQuery) {
      setPage(prev => prev + 1);
    }
  }

  function changePageSize(size: number) {
    setPageSize(size);
  }
}
