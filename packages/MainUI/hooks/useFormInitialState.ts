import { EntityData, Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';

export const useFormInitialState = (
  record: EntityData | undefined,
  formInitialization: FormInitializationResponse,
  fieldsByColumnName: Record<string, Field>,
) => {
  return useMemo(() => {
    const acc = { ...formInitialization.sessionAttributes } as Record<string, string | boolean | null>;

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

    return { ...acc, ...record };
  }, [
    fieldsByColumnName,
    formInitialization.auxiliaryInputValues,
    formInitialization.columnValues,
    formInitialization.sessionAttributes,
    record,
  ]);
};
