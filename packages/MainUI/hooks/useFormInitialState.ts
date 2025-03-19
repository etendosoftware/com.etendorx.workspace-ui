import { useMemo } from 'react';
import { EntityData, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import useFormParent, { ParentFieldName } from './useFormParent';
import { useParentTabContext } from '@/contexts/tab';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';

export const useFormInitialState = (formInitialization?: FormInitializationResponse | null) => {
  const { tab } = useParentTabContext();
  const parentData = useFormParent(ParentFieldName.HQL_NAME);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  const initialState = useMemo(() => {
    if (!formInitialization) return null;

    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    Object.entries(formInitialization.auxiliaryInputValues).forEach(([key, { value }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
      acc[newKey] = value;
    });

    Object.entries(formInitialization.columnValues).forEach(([key, { value, identifier }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
      acc[newKey] = value;

      if (identifier) {
        acc[newKey + '$_identifier'] = identifier;
      }
    });

    return { ...acc, ...parentData };
  }, [fieldsByColumnName, formInitialization, parentData]);

  return initialState;
};
