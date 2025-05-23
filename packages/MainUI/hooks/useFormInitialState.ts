import { useMemo } from 'react';
import { EntityData, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import useFormParent from './useFormParent';
import { useTabContext } from '@/contexts/tab';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { FieldName } from './types';

export const useFormInitialState = (formInitialization?: FormInitializationResponse | null) => {
  const { tab } = useTabContext();
  const parentData = useFormParent(FieldName.HQL_NAME);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  const initialState = useMemo(() => {
    if (!formInitialization) return null;

    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    Object.entries(formInitialization.auxiliaryInputValues).forEach(([key, { value }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;

      acc[newKey] = value;
    });

    Object.entries(formInitialization.columnValues).forEach(([key, { value, identifier }]) => {
      const field = fieldsByColumnName?.[key];
      const newKey = field?.hqlName ?? key;

      acc[newKey] = value;

      if (identifier) {
        acc[newKey + '$_identifier'] = identifier;
      }
    });

    const processedParentData = { ...parentData };

    return { ...acc, ...processedParentData };
  }, [fieldsByColumnName, formInitialization, parentData]);

  return initialState;
};
