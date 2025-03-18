import { useMemo } from 'react';
import { EntityData, Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import useFormParent from './useFormParent';

export const useFormInitialState = (
  record: EntityData | undefined,
  formInitialization: FormInitializationResponse,
  fieldsByColumnName: Record<string, Field>,
) => {
  const parentData = useFormParent();

  const initialState = useMemo(() => {
    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    Object.entries(formInitialization.auxiliaryInputValues).forEach(([key, { value }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
      acc[newKey] = value;
    });

    Object.entries(formInitialization.columnValues).forEach(([key, { value, identifier }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;
      acc[newKey] = value;

      if (identifier) {
        acc[newKey + '_identifier'] = identifier;
      }
    });

    return { ...acc, ...parentData, ...record };
  }, [
    fieldsByColumnName,
    formInitialization.auxiliaryInputValues,
    formInitialization.columnValues,
    formInitialization.sessionAttributes,
    parentData,
    record,
  ]);

  return initialState;
};
