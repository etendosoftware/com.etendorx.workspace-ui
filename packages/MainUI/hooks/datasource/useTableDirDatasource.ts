import { useCallback, useState } from 'react';
import { type Field, type Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { useTabContext } from '@/contexts/tab';
import useFormParent from '../useFormParent';
import { FieldName } from '../types';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}

export const useTableDirDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseTableDirDatasourceParams) => {
  const { windowId } = useParams<{ windowId: string }>();
  const { getValues, watch } = useFormContext();
  const { tab } = useTabContext();
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const parentData = useFormParent(FieldName.INPUT_NAME);
  const [error, setError] = useState<Error>();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const value = watch(field.hqlName);

  const fetch = useCallback(
    async (_currentValue: typeof value, reset = false, search = '') => {
      try {
        if (!field || !tab) {
          return;
        }

        setLoading(true);

        if (reset) {
          setCurrentPage(0);
          setHasMore(true);
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
          inpwindowId: tab.windowId,
          inpTableId: field.column.table,
          initiatorField: field.hqlName,
          _constructor: 'AdvancedCriteria',
          _OrExpression: 'true',
          _textMatchStyle: 'substring',
          ...(typeof _currentValue !== 'undefined' ? { _currentValue } : {}),
          ...parentData,
        });

        if (search) {
          const dummyId = new Date().getTime();

          body.append(
            'criteria',
            JSON.stringify({
              fieldName: '_dummy',
              operator: 'equals',
              value: dummyId,
            }),
          );

          const searchFields = [];
          if (field.selector?.displayField) {
            searchFields.push(field.selector.displayField);
          }
          if (field.selector?.extraSearchFields) {
            searchFields.push(...field.selector.extraSearchFields.split(',').map(f => f.trim()));
          }
          if (searchFields.length === 0) {
            searchFields.push('name', 'value', 'description');
          }
          searchFields.forEach(fieldName => {
            body.append(
              'criteria',
              JSON.stringify({
                fieldName,
                operator: 'iContains',
                value: search,
              }),
            );
          });
        }

        Object.entries(getValues()).forEach(([key, value]) => {
          const _key = tab.fields[key]?.inputName || key;
          const stringValue = String(value);

          const valueMap = {
            true: 'Y',
            false: 'N',
            null: 'null',
          };

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

          if (safeValue) {
            body.set(_key, safeValue);
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

          if (reset) {
            setRecords(data.response.data);
          } else {
            const recordMap = new Map();

            records.forEach(record => {
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            });

            data.response.data.forEach((record: { id: string }) => {
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            });

            setRecords(Array.from(recordMap.values()));
          }

          if (!reset) {
            setCurrentPage(prev => prev + 1);
          }
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        if (reset) {
          setRecords([]);
        }

        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [field, tab, currentPage, pageSize, initialPageSize, windowId, parentData, getValues, records],
  );

  const search = useCallback(
    (term: string) => {
      setSearchTerm(term);
      fetch(value, true, term);
    },
    [fetch, value],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch(value, false, searchTerm);
    }
  }, [fetch, loading, hasMore, value, searchTerm]);

  const refetch = useCallback(
    (reset = true) => {
      fetch(value, reset, searchTerm);
    },
    [fetch, value, searchTerm],
  );

  return {
    records,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    search,
    searchTerm,
  };
};
