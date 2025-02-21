import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, Column, CompositeCriteria } from '../api/types';
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

  const fetchMore = useCallback(() => {
    if (!searchQuery) {
      setPage(prev => prev + 1);
    }
  }, [searchQuery]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
  }, []);

  const searchCriteria = useMemo(() => {
    if (!searchQuery || !columns) return [];

    const referenceFields = ['organization', 'transactionDocument', 'businessPartner', 'partnerAddress'];

    //TODO: Implement util either in the front or back to parse dif columns types
    const excludedFields = ['orderDate', 'grandTotalAmount', 'amount', 'price', 'quantity'];

    const compositeCriteria: CompositeCriteria = {
      operator: 'or',
      criteria: columns
        .filter(column => !excludedFields.includes(column.columnName))
        .map(column => ({
          fieldName: referenceFields.includes(column.columnName)
            ? `${column.columnName}$_identifier`
            : column.columnName,
          operator: 'iContains',
          value: searchQuery,
        })),
    };

    return [compositeCriteria];
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

      if (response.error || response.status != 0) {
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
    }),
    [error, loading, fetchMore, changePageSize, load, records, loaded],
  );
}
