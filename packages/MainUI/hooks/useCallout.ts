import { useCallback } from 'react';
import { getInputName } from '@workspaceui/etendohookbinder/src/utils/form';
import { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { FieldValues } from 'react-hook-form';

export interface UseCalloutProps {
  field: Field;
  tab: Tab;
  payload: FieldValues;
  parentId?: string | null;
  rowId?: string | null;
}

const _action = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'CHANGE';

export const useCallout = ({ field, tab, payload, parentId, rowId }: UseCalloutProps) => {
  return useCallback(async () => {
    const params = new URLSearchParams({
      _action,
      MODE,
      TAB_ID: tab.id,
      CHANGED_COLUMN: getInputName(field),
      PARENT_ID: parentId ?? 'null',
      ROW_ID: rowId ?? 'null',
    });

    return Metadata.kernelClient.post(`?${params}`, payload);
  }, [field, parentId, payload, rowId, tab.id]);
};
