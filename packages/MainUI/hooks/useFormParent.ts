import { useParentTabContext } from '@/contexts/tab';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useMemo } from 'react';

export default function useFormParent() {
  const { tab, parentTab, parentRecord } = useParentTabContext();

  return useMemo(() => {
    const result = {} as EntityData;

    if (tab && parentTab && parentRecord) {
      const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
      const parentFields = getFieldsByInputName(parentTab);

      parentColumns.forEach(
        field => {
          const parentFieldName = parentFields[field.inputName].hqlName;
          result[field.hqlName] = parentRecord[parentFieldName];
        },
        {} as Record<string, unknown>,
      );
    }

    return result;
  }, [parentRecord, parentTab, tab]);
}
