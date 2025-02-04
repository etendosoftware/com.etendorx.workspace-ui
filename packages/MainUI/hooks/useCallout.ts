import { useCallback } from 'react';
import { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { getInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { FieldValues } from 'react-hook-form';

export interface UseCalloutProps {
  field: Field;
  tab: Tab;
  parentId?: string | null;
  rowId?: string | null;
}

const _action = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'CHANGE';

export const useCallout = ({ field, tab, parentId, rowId }: UseCalloutProps) => {
  return useCallback(async (payload: FieldValues) => {
    const params = new URLSearchParams({
      _action,
      MODE,
      TAB_ID: tab.id,
      CHANGED_COLUMN: getInputName(field),
      stateless: "true",
    });

    if (rowId) {
      params.set("ROW_ID", rowId);
    }

    if (parentId) {
      params.set("PARENT_ID", parentId);
    }

    return Metadata.kernelClient.post(`?${params}`, payload);
  }, [field, parentId, rowId, tab.id]);
};
