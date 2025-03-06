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
  const { fieldsByHqlName } = useMetadataContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const value = watch(field.hqlName);

  const fetch = useCallback(async () => {
    try {
      if (!field) {
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
        _currentValue: getValues(field.hqlName),
      });

      Object.entries(getValues()).forEach(([key, value]) => {
        const _key = fieldsByHqlName[key]?.inputName;
        let safeValue = String(value);
        safeValue = value === 'true' ? 'Y' : value === 'false' ? 'N' : value;
        body.set(_key || key, safeValue);
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
  }, [field, fieldsByHqlName, getValues, windowId]);

  useEffect(() => {
    fetch();
  }, [fetch, value]);

  return { records, loading, error, refetch: fetch };
};
