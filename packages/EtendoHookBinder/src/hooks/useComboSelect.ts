import { Metadata } from '../api/metadata';
import { Field } from '../api/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

const baseParams = {
  inpissotrx: true,
  IsSelectorItem: true,
  isc_dataFormat: 'json',
  _operationType: 'fetch',
  moduleId: '0',
};

const buildPayload = (field: Field, params: Record<string, unknown>) => {
  const payload = new URLSearchParams();

  params = {
    ...baseParams,
    ...field.selector,
    ...params,
    targetProperty: field.hqlName,
    columnName: field.columnName,
  };

  Object.entries(params).forEach(([name, value]) => {
    if (value) {
      payload.append(name, value.toString());
    }
  });

  return payload;
};

export function useComboSelect(field: Field, options: Record<string, unknown>) {
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

      const payload = buildPayload(field, options);

      setError(undefined);
      setLoading(true);

      const response = await Metadata.datasourceServletClient.post(`${field.selector.datasourceName}?_startRow=0&_endRow=9999`, payload);

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
  }, [field, options]);

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
