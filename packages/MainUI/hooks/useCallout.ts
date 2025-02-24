import { useCallback } from 'react';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { FieldValues } from 'react-hook-form';
import { useMetadataContext } from './useMetadataContext';

export interface UseCalloutProps {
  field: Field;
  parentId?: string | null;
  rowId?: string | null;
}

const _action = 'org.openbravo.client.application.window.FormInitializationComponent';
const MODE = 'CHANGE';

export const useCallout = ({ field, parentId, rowId }: UseCalloutProps) => {
  const { tab } = useMetadataContext();
  const TAB_ID = tab?.id || '';

  return useCallback(
    async (payload: FieldValues) => {
      const params = new URLSearchParams({
        _action,
        MODE,
        TAB_ID,
        CHANGED_COLUMN: field.inputName,
      });

      if (rowId) {
        params.set('ROW_ID', rowId);
      }

      if (parentId) {
        params.set('PARENT_ID', parentId);
      }

      return Metadata.kernelClient.post(`?${params}`, payload);
    },
    [TAB_ID, field.inputName, parentId, rowId],
  );
};
