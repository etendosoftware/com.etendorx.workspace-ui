import { useTabContext } from '@/contexts/tab';
import { EntityData, FieldType } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useMemo } from 'react';
import { FieldName } from './types';
import { getFieldReference } from '@/utils';
import { formatDateForEtendo } from '@/utils/formUtils';

export default function useFormParent(nameToUse: FieldName = FieldName.HQL_NAME) {
  const { tab, parentTab, parentRecord } = useTabContext();

  return useMemo(() => {
    const result = {} as EntityData;

    if (tab && parentTab && parentRecord) {
      const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
      const parentFields = getFieldsByInputName(parentTab);

      parentColumns.forEach(
        field => {
          const parentField = parentFields[field.inputName];
          const parentFieldName = parentField.hqlName;
          let value = parentRecord[parentFieldName];

          if (getFieldReference(parentField.column.reference) == FieldType.DATE) {
            value = formatDateForEtendo(String(value)) ?? value;
          }

          result[field[nameToUse]] = value;
        },
        {} as Record<string, unknown>,
      );
    }

    return result;
  }, [nameToUse, parentRecord, parentTab, tab]);
}
