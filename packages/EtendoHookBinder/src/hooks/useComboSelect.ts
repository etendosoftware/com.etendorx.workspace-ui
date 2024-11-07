import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatasourceOptions, FieldDefinition } from '../api/types';
import { Datasource } from '../api/datasource';
import { Metadata } from '../api/metadata';

export function useComboSelect(field: FieldDefinition) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const load = useCallback(async () => {
    try {
      if (!field.original?.selector || !field.original.selector._selectorDefinitionId) {
        console.debug('missing selector definition id', field, field.original?.referencedEntity);
        setLoaded(true);

        return;
      }


      const payload = new URLSearchParams();
      const p = {
        // windowId: '143',
        // tabId: '186',
        // adTabId: '186',
        // moduleId: 0,
        // targetProperty: 'businessPartner',
        // columnName: 'C_BPartner_ID',
        // IsSelectorItem: true,
        // _operationType: 'fetch',
        _startRow: 0,
        _endRow: 75,
        // operator: 'and',
        // _org: 'E443A31992CB4635AFCAEABE7183CE85',
        _selectorDefinitionId: field.original.selector._selectorDefinitionId,
        // filterClass: 'org.openbravo.userinterface.selector.SelectorDataSourceFilter',
      };

      Object.entries(p).forEach(([pName, pValue]) => {
        payload.append(pName, pValue?.toString());
      });

      setError(undefined);
      setLoading(true);

      const response = await Metadata.getDatasource(field.original.selector.datasourceName, payload);

      if (response.ok) {
        const newRecords = response.data;
        setRecords(prevRecords => {
          const result = prevRecords.concat(newRecords).reduce((result, current) => {
            result[current.id as string] = current;

            return result;
          }, {});

          return Object.values(result) as typeof prevRecords;
        });
        setLoaded(true);
      } else {
        throw new Error(response.error.message);
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
