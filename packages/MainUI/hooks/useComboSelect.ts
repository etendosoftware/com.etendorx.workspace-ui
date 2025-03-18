import { useCallback, useEffect, useState } from 'react';
import { EntityData, type Field, type Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { useMetadataContext } from './useMetadataContext';
import { useParentTabContext } from '@/contexts/tab';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';

export interface UseTableDirDatasourceParams {
  field: Field;

  tab?: Tab;
}

export const useComboSelect = ({ field }: UseTableDirDatasourceParams) => {
  const { windowId } = useParams<{ windowId: string }>();
  const { watch } = useFormContext();
  const { tab } = useMetadataContext();
  const { parentRecord, parentTab } = useParentTabContext();
  const [records, setRecords] = useState<EntityData[]>([]);
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

        let parentData;

        if (parentTab && parentRecord) {
          const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
          const parentFields = getFieldsByInputName(parentTab);

          parentData = parentColumns.reduce(
            (acc, field) => {
              const parentFieldName = parentFields[field.inputName].hqlName;
              acc[field.inputName] = parentRecord[parentFieldName];
              return acc;
            },
            {} as Record<string, unknown>,
          );
        }

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
          ...(typeof _currentValue !== 'undefined' ? { _currentValue } : {}),
          ...parentData,
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
    [field, parentRecord, parentTab, tab, windowId],
  );

  useEffect(() => {
    fetch(value);
  }, [fetch, value]);

  return { records, loading, error, refetch: fetch };
};
