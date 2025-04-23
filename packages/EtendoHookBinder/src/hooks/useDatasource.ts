import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, Column, MRT_ColumnFiltersState } from '../api/types';
import { datasource } from '../api/datasource';
import { SearchUtils, ColumnFilterUtils } from '../utils/search-utils';

const loadData = async (entity: string, page: number, pageSize: number, params: DatasourceOptions) => {
  const safePageSize = pageSize ?? 1000;
  const startRow = (page - 1) * pageSize;
  const endRow = page * pageSize - 1;

  const processedParams = {
    ...params,
    startRow,
    endRow,
    pageSize: safePageSize,
  };

  const { response } = await datasource.get(entity, processedParams);

  return response;
};

const defaultParams: DatasourceOptions = {
  pageSize: 1000,
};

export function useDatasource(
  entity: string,
  params: DatasourceOptions = defaultParams,
  searchQuery?: string,
  columns?: Column[],
  columnFilters: MRT_ColumnFiltersState = [],
) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isImplicitFilterApplied, setIsImplicitFilterApplied] = useState(params.isImplicitFilterApplied ?? false);
  const [pageSize, setPageSize] = useState(params.pageSize ?? defaultParams.pageSize);
  const [activeColumnFilters, setActiveColumnFilters] = useState<MRT_ColumnFiltersState>(columnFilters);

  const removeRecordLocally = useCallback((recordId: string) => {
    setRecords(prevRecords => prevRecords.filter(record => String(record.id) !== recordId));
  }, []);

  const fetchMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const updateColumnFilters = useCallback((filters: MRT_ColumnFiltersState) => {
    setActiveColumnFilters(filters);
    setPage(1);
    setRecords([]);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const toggleImplicitFilters = useCallback(
    (value?: boolean) => {
      const newValue = value !== undefined ? value : !isImplicitFilterApplied;
      setIsImplicitFilterApplied(newValue);
      setPage(1);
    },
    [isImplicitFilterApplied],
  );

  const columnFilterCriteria = useMemo(() => {
    if (!columns || !activeColumnFilters.length) return [];

    return ColumnFilterUtils.createColumnFilterCriteria(activeColumnFilters, columns);
  }, [activeColumnFilters, columns]);

  const queryParams = useMemo(() => {
    const baseCriteria = params.criteria || [];
    const searchCriteriaArray = searchQuery && columns ? SearchUtils.createSearchCriteria(columns, searchQuery) : [];

    let allCriteria = [...baseCriteria];

    if (searchCriteriaArray.length > 0) {
      allCriteria = [...allCriteria, ...searchCriteriaArray];
    }

    if (columnFilterCriteria.length > 0) {
      allCriteria = [...allCriteria, ...columnFilterCriteria];
    }

    return {
      ...params,
      criteria: allCriteria,
      isImplicitFilterApplied,
    };
  }, [params, searchQuery, columns, columnFilterCriteria, isImplicitFilterApplied]);

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
          if (page === 1 || searchQuery) {
            return [...response.data];
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    setRecords([]);
    setLoaded(false);
    setPage(1);
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
      updateColumnFilters,
      activeColumnFilters,
      removeRecordLocally,
      refetch,
    }),
    [
      loading,
      error,
      fetchMore,
      changePageSize,
      load,
      records,
      loaded,
      isImplicitFilterApplied,
      toggleImplicitFilters,
      updateColumnFilters,
      activeColumnFilters,
      removeRecordLocally,
      refetch,
    ],
  );
}
