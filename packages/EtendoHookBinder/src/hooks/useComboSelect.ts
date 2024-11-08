import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldDefinition } from '../api/types';
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
        setLoaded(true);

        return;
      }

      console.debug(field.original.selector);

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
        _endRow: 5000,
        // operator: 'and',
        // _org: 'E443A31992CB4635AFCAEABE7183CE85',
        _selectorDefinitionId: field.original.selector._selectorDefinitionId,
        // filterClass: field.original.selector.filterClass,
        // filterClass: 'org.openbravo.userinterface.selector.SelectorDataSourceFilter',
      };

      Object.entries(p).forEach(([pName, pValue]) => {
        payload.append(pName, pValue?.toString());
      });

      setError(undefined);
      setLoading(true);

      const response = await Metadata.getDatasource(field.original.selector.datasourceName, payload);

      if (response.ok) {
        setRecords(response.data.response.data);
        setLoaded(true);
      } else {
        throw new Error(await response.text());
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

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
