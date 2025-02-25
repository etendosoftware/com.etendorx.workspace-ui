import { Metadata } from '../api/metadata';
import { Field } from '../api/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useComboSelect(field: Field, options: { windowId?: string; tabId?: string } = {}) {
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
      const p: Record<string, string | number | boolean> = {
        ...field.selector,
        startRow: 0,
        endRow: 75,
        inpissotrx: true,
        IsSelectorItem: true,
        isc_dataFormat: "json",
        _operationType: "fetch",
        moduleId: "0",
        targetProperty: field.hqlName,
        columnName: field.columnName,
      };

      if (options.windowId) {
        p.windowId = options.windowId;
      }

      if (options.tabId) {
        p.adTabId = options.tabId;
      }

      Object.entries(p).forEach(([pName, pValue]) => {
        payload.append(pName, pValue?.toString());
      });

      setError(undefined);
      setLoading(true);

      const response = await Metadata.getDatasource(field.selector.datasourceName, payload);

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
  }, [field, options.tabId, options.windowId]);

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
