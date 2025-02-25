import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, Column } from '../api/types';
import { Datasource } from '../api/datasource';
import { SearchUtils } from '../utils/search-utils';

const loadData = async (entity: string, page: number, pageSize: number, params: DatasourceOptions) => {
  const safePageSize = pageSize ?? 1000;
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const processedParams = {
    ...params,
    startRow,
    endRow,
    pageSize: safePageSize,
    isImplicitFilterApplied: params.isImplicitFilterApplied ?? true,
  };

  const { response } = await Datasource.get(entity, processedParams);

  return response;
};

const defaultParams: DatasourceOptions = {
  pageSize: 1000,
  isImplicitFilterApplied: true,
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
  const [isImplicitFilterApplied, setIsImplicitFilterApplied] = useState(params.isImplicitFilterApplied ?? true);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);

  const fetchMore = useCallback(() => {
    if (!searchQuery) {
      setPage(prev => prev + 1);
    }
  }, [searchQuery]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const toggleImplicitFilters = useCallback((value?: boolean) => {
    setIsImplicitFilterApplied(prev => (value !== undefined ? value : !prev));
    setPage(1);
    setRecords([]);
  }, []);

  const searchCriteria = useMemo(() => {
    if (!searchQuery || !columns) return [];

    const criteria = SearchUtils.createSearchCriteria(columns, searchQuery);
    return criteria;
  }, [searchQuery, columns]);

  const queryParams = useMemo(() => {
    const baseCriteria = params.criteria || [];
    const allCriteria = searchQuery ? [...baseCriteria, ...searchCriteria] : baseCriteria;

    return {
      ...params,
      criteria: allCriteria,
      isImplicitFilterApplied,
    };
  }, [params, searchCriteria, searchQuery, isImplicitFilterApplied]);

  const load = useCallback(async () => {
    try {
      if (!entity) {
        setLoaded(true);
        return;
      }

      setError(undefined);
      setLoading(true);

      const safePageSize = pageSize ?? 1000;
      const response = await loadData(entity, page, safePageSize, queryParams);

      if (response.error || response.status != 0) {
        throw new Error(response.error.message);
      } else {
        setRecords(prevRecords => {
          if (searchQuery || page === 1) {
            return response.data;
          }

          const mergedRecords = [...prevRecords, ...response.data];
          const uniqueRecords = mergedRecords.reduce(
            (acc, current) => {
              acc[current.id as string] = current;
              return acc;
            },
            {} as Record<string, unknown>,
          );

          return Object.values(uniqueRecords);
        });
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [entity, page, pageSize, queryParams, searchQuery]);

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
      isImplicitFilterApplied,
      toggleImplicitFilters,
    }),
    [error, loading, fetchMore, changePageSize, load, records, loaded, isImplicitFilterApplied, toggleImplicitFilters],
  );
}
