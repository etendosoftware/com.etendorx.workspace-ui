import { useCallback, useState } from 'react';
import { FieldType, type Field, type Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useTabContext } from '@/contexts/tab';
import useFormParent from '../useFormParent';
import { FieldName } from '../types';
import { logger } from '@/utils/logger';
import { getFieldReference } from '@/utils';
import { formatDateForEtendo } from '@/utils/formUtils';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}

export const useTableDirDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseTableDirDatasourceParams) => {
  const { getValues, watch } = useFormContext();
  const { tab } = useTabContext();
  const windowId = tab.window;
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

        console.debug(parentData);

        const body = new URLSearchParams({
          _startRow: startRow.toString(),
          _endRow: endRow.toString(),
          _operationType: 'fetch',
          ...field.selector,
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpwindowId: windowId,
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
          const currentField = tab.fields[key];
          const _key = currentField?.inputName || key;
          const stringValue = String(value);

          const valueMap = {
            true: 'Y',
            false: 'N',
            null: 'null',
          };

          let safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;


          if (currentField && getFieldReference(currentField.column.reference) == FieldType.DATE) {
            safeValue = formatDateForEtendo(safeValue);
          }

          body.set(_key, safeValue);
          
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
          console.debug(data);
          throw new Error(statusText);
        }
      } catch (err) {
        logger.warn(err);

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
