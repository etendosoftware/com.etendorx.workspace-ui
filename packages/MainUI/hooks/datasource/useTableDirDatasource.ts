import { useCallback, useEffect, useState } from 'react';
import type { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
}

export const useTableDirDatasource = ({ field }: UseTableDirDatasourceParams) => {
  const { windowId } = useParams<{ windowId: string }>();
  const { getValues, watch } = useFormContext();
  const { tab } = useMetadataContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const value = watch(field.hqlName);

  const fetch = useCallback(
    async (_currentValue: typeof value) => {
      try {
        if (!field || !tab) {
          return;
        }

        setLoading(true);

        const body = new URLSearchParams({
          _startRow: '0',
          _endRow: '75',
          _operationType: 'fetch',
          ...field.selector,
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpTableId: field.column.table,
          initiatorField: field.hqlName,
          _currentValue: typeof _currentValue === 'undefined' ? "" : _currentValue,
        });

        Object.entries(getValues()).forEach(([key, value]) => {
          const _key = tab.fields[key]?.inputName;
          let safeValue = String(value);
          safeValue = safeValue === 'true' ? 'Y' : safeValue === 'false' ? 'N' : value;
          if (safeValue) {
            body.set(_key || key, safeValue);
          }
        });

        const { data, statusText } = await datasource.client.request(field.selector?.datasourceName ?? '', {
          method: 'POST',
          body,
        });

        if (data?.response?.data) {
          setRecords(data.response.data);
        } else {
          throw new Error(statusText);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [field, getValues, tab, windowId],
  );

  useEffect(() => {
    fetch(value);
  }, [fetch, value]);

  return { records, loading, error, refetch: fetch };
};
