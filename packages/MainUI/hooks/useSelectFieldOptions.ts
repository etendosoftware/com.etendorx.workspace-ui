import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { EntityData, Field } from '@workspaceui/etendohookbinder/src/api/types';
import { SelectProps } from '@/components/Form/FormView/selectors/components/types';

export const useSelectFieldOptions = (field: Field, records: EntityData[]) => {
  const { watch } = useFormContext();
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;
  const [currentValue, currentIdentifier] = watch([field.hqlName, field.hqlName + '$_identifier']);

  return useMemo(() => {
    const result: SelectProps['options'] = [];

    records.forEach(record => {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label) {
        result.push({ id, label });
      }
    });

    const currentOption = result.find(record => record.id === currentValue);

    if (!currentOption && currentValue && currentIdentifier) {
      result.push({ id: currentValue, label: currentIdentifier });
    }

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);
};
