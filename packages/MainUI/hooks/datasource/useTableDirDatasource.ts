import { useCallback, useEffect, useState } from 'react';
import type { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useMetadataContext } from '../useMetadataContext';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
}

export const useTableDirDatasource = ({ field }: UseTableDirDatasourceParams) => {
  const { getValues, watch } = useFormContext();
  const { fieldsByHqlName } = useMetadataContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [values, setValues] = useState<Record<string, unknown>>(getValues());

  useEffect(() => {
    const { unsubscribe } = watch(_values => {
      setValues(_values);
    });

    return () => unsubscribe();
  }, [watch]);

  const fetch = useCallback(
    async (controller: AbortController) => {
      try {
        if (!field) {
          return;
        }

        setLoading(true);

        const body = new URLSearchParams({
          moduleId: '0',
          _startRow: '0',
          _endRow: '75',
          _operationType: 'fetch',
          tabId: field.tab,
          inpTabId: field.tab,
          ...field.selector,
          initiatorField: field.hqlName,
        });

        Object.entries(values).forEach(([key, value]) => {
          if (key !== field.hqlName) {
            const _key = fieldsByHqlName[key]?.inputName;

            if (_key) {
              body.set(_key, String(value));
            }
          }
        });

        const { data, statusText } = await datasource.client.request('ComboTableDatasourceService', {
          signal: controller.signal,
          method: 'POST',
          body,
        });

        if (data?.response?.data && !controller.signal.aborted) {
          setRecords(data.response.data);
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [field, fieldsByHqlName, values],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(controller);

    return () => {
      controller.abort();
    };
  }, [fetch]);

  return { records, loading, error };
};
