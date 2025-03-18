import { useParentTabContext } from '@/contexts/tab';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useCallback, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';

export default function useFormParent(setValue: UseFormSetValue<EntityData>) {
  const { tab, parentTab, parentRecord } = useParentTabContext();

  const setParent = useCallback(() => {
    if (tab && parentTab && parentRecord) {
      const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
      const parentFields = getFieldsByInputName(parentTab);

      parentColumns.forEach(
        field => {
          const parentFieldName = parentFields[field.inputName].hqlName;
          setValue(field.hqlName, parentRecord[parentFieldName]);
        },
        {} as Record<string, unknown>,
      );
    }
  }, [parentRecord, parentTab, setValue, tab]);

  useEffect(() => {
    setParent();
  }, [setParent]);
}
