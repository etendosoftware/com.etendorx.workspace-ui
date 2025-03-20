import { useParentTabContext } from '@/contexts/tab';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useMemo } from 'react';

export enum ParentFieldName {
  INPUT_NAME = 'inputName',
  HQL_NAME = 'hqlName',
  COLUMN_NAME = 'columnName',
}

export default function useFormParent(nameToUse: ParentFieldName = ParentFieldName.HQL_NAME) {
  const { tab, parentTab, parentRecord } = useParentTabContext();

  return useMemo(() => {
    const result = {} as EntityData;

    if (tab && parentTab && parentRecord) {
      const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
      const parentFields = getFieldsByInputName(parentTab);

      parentColumns.forEach(
        field => {
          const parentFieldName = parentFields[field.inputName].hqlName;
          result[field[nameToUse]] = parentRecord[parentFieldName];
        },
        {} as Record<string, unknown>,
      );
    }

    return result;
  }, [nameToUse, parentRecord, parentTab, tab]);
}
