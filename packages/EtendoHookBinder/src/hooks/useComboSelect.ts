import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';
import { Field } from '@/api/types';

export function useComboSelect(field: Field, options: Record<string, string> = {}) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      if (!field?.selector || !field.selector._selectorDefinitionId) {
        setLoaded(true);

        return;
      }

      const payload = new URLSearchParams();
      const p: Record<string, string | number> = {
        _startRow: 0,
        _endRow: 9999,
        _selectorDefinitionId: field.selector._selectorDefinitionId,
        // adTabId: '186',
        // moduleId: 0,
        // targetProperty: 'businessPartner',
        // columnName: 'C_BPartner_ID',
        // IsSelectorItem: true,
        // _operationType: 'fetch',
        // operator: 'and',
        // _org: 'E443A31992CB4635AFCAEABE7183CE85',
        // filterClass: field.original.selector.filterClass,
        // filterClass: 'org.openbravo.userinterface.selector.SelectorDataSourceFilter',
      };

      if (options.windowId) {
        p.windowId = options.windowId;
      }

      if (options.tabId) {
        p.tabId = options.tabId;
      }

      Object.entries(p).forEach(([pName, pValue]) => {
        payload.append(pName, pValue?.toString());
      });

      setError(undefined);
      setLoading(true);

      const response = await Metadata.getDatasource(field.original.selector.datasourceName, payload);

      if (!response.ok || response.data?.response?.error) {
        throw new Error(await response.text());
      } else {
        setRecords(response.data.response.data);
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [field, options.windowId, options.tabId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      loading,
      error,
      load,
      records,
      loaded,
    }),
    [error, load, loaded, loading, records],
  );
}
