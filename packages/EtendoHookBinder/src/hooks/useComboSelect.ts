import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldDefinition } from '../api/types';
import { Metadata } from '../api/metadata';

export function useComboSelect(field: FieldDefinition, options: Record<string, string> = {}) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      if (!field.original?.selector || !field.original.selector._selectorDefinitionId) {
        setLoaded(true);

        return;
      }

      const payload = new URLSearchParams();
      const p = {
        _startRow: 0,
        _endRow: 9999,
        _selectorDefinitionId: field.original.selector._selectorDefinitionId,
        windowId: options.windowId,
        tabId: options.tabId,
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
  }, [field.original.selector, options.tabId, options.windowId]);

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
