import { useCallback, useState } from 'react';
import type { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}

export const useTableDirDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseTableDirDatasourceParams) => {
  const { windowId } = useParams<{ windowId: string }>();
  const { getValues, watch } = useFormContext();
  const { tab } = useMetadataContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const value = watch(field.hqlName);

  const fetch = useCallback(
    async (_currentValue: typeof value, reset = false) => {
      try {
        if (!field || !tab) {
          return;
        }

        setLoading(true);

        if (reset) {
          setCurrentPage(0);
          setHasMore(true);
          setRecords([]);
        }

        const startRow = reset ? 0 : currentPage * pageSize;
        const endRow = reset ? initialPageSize : startRow + pageSize;

        const body = new URLSearchParams({
          _startRow: startRow.toString(),
          _endRow: endRow.toString(),
          _operationType: 'fetch',
          ...field.selector,
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpTableId: field.column.table,
          initiatorField: field.hqlName,
          _currentValue: typeof _currentValue === 'undefined' ? '' : _currentValue,
        });

        Object.entries(getValues()).forEach(([key, value]) => {
          const _key = tab.fields[key]?.inputName;
          const stringValue = String(value);

          const valueMap = {
            true: 'Y',
            false: 'N',
          } as const;

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

          if (safeValue) {
            body.set(_key || key, safeValue);
          }
        });

        const { data, statusText } = await datasource.client.request(field.selector?.datasourceName ?? '', {
          method: 'POST',
          body,
        });

        if (data?.response?.data) {
          if (!data.response.data.length || data.response.data.length < pageSize) {
            setHasMore(false);
          }

          setRecords(prevRecords => (reset ? data.response.data : [...prevRecords, ...data.response.data]));

          if (!reset) {
            setCurrentPage(prev => prev + 1);
          }
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [field, getValues, tab, windowId, currentPage, pageSize, initialPageSize],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch(value);
    }
  }, [fetch, loading, hasMore, value]);

  return {
    records,
    loading,
    error,
    refetch: (reset = true) => fetch(value, reset),
    loadMore,
    hasMore,
  };
};
