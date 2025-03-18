import { useEffect, useMemo } from 'react';
import { UseFormReset } from 'react-hook-form';
import { EntityData, Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

export const useFormInitialState = (
  record: EntityData | undefined,
  formInitialization: FormInitializationResponse,
  fieldsByColumnName: Record<string, Field>,
  reset: UseFormReset<EntityData>,
) => {
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

    return { ...acc, ...record };
  }, [
    fieldsByColumnName,
    formInitialization.auxiliaryInputValues,
    formInitialization.columnValues,
    formInitialization.sessionAttributes,
    record,
  ]);

  useEffect(() => {
    reset(initialState);
  }, [reset, initialState]);
};
