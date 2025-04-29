import { useMemo } from 'react';
import { EntityData, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import useFormParent, { ParentFieldName } from './useFormParent';
import { useTabContext } from '@/contexts/tab';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { isDateField, formatDateFromEtendo } from '@/utils/formUtils';

export const useFormInitialState = (formInitialization?: FormInitializationResponse | null) => {
  const { tab } = useTabContext();
  const parentData = useFormParent(ParentFieldName.HQL_NAME);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  const initialState = useMemo(() => {
    if (!formInitialization) return null;

    const acc = { ...formInitialization.sessionAttributes } as EntityData;

    Object.entries(formInitialization.auxiliaryInputValues).forEach(([key, { value }]) => {
      const newKey = fieldsByColumnName?.[key]?.hqlName ?? key;

      acc[newKey] = value;
    });

    Object.entries(formInitialization.columnValues).forEach(([key, { value, classicValue, identifier }]) => {
      const field = fieldsByColumnName?.[key];
      const newKey = field?.hqlName ?? key;

      if (field && isDateField(field)) {
        acc[newKey] = formatDateFromEtendo(classicValue);
      } else {
        acc[newKey] = value;
      }

      if (identifier) {
        acc[newKey + '$_identifier'] = identifier;
      }
    });

    const processedParentData = { ...parentData };
    if (parentData) {
      Object.entries(parentData).forEach(([key, value]) => {
        if (typeof value === 'string' && tab?.fields[key] && isDateField(tab?.fields[key])) {
          processedParentData[key] = formatDateFromEtendo(value as string);
        }
      });
    }

    return { ...acc, ...processedParentData };
  }, [fieldsByColumnName, formInitialization, parentData, tab?.fields]);

  return initialState;
};
