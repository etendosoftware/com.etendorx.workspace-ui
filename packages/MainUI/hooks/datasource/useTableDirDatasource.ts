import { useCallback, useEffect, useState } from 'react';
import type { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { useFormContext } from 'react-hook-form';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
}

export const useTableDirDatasource = ({ field }: UseTableDirDatasourceParams) => {
  const { windowId } = useParams<{ windowId: string }>();
  const { getValues, watch } = useFormContext();
  const { tab, selected } = useMetadataContext();
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

        let parentData = {};

        if (tab.parentTabId) {
          const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
          const parent = tab.level > 0 ? selected[tab.level - 1] : {};
          const parentTab = await Metadata.getTab(tab.parentTabId);
          const parentFields = getFieldsByInputName(parentTab);

          parentData = parentColumns.reduce(
            (acc, field) => {
              const parentFieldName = parentFields[field.inputName].hqlName;
              acc[field.inputName] = parent[parentFieldName];
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

        Object.entries(getValues()).forEach(([key, value]) => {
          const _key = tab.fields[key]?.inputName;
          const stringValue = String(value);

          const valueMap = {
            true: 'Y',
            false: 'N',
            null: 'null',
          };

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

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
    [field, getValues, selected, tab, windowId],
  );

  useEffect(() => {
    fetch(value);
  }, [fetch, value]);

  return { records, loading, error, refetch: fetch };
};
