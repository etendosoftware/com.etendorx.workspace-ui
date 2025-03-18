import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from './components/Select';
import { useMemo } from 'react';
import { SelectProps } from './components/types';
import { useComboSelect } from '@/hooks/useComboSelect';
import { useFormContext } from 'react-hook-form';

export const SelectSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;
  const { records, refetch } = useComboSelect({ field });
  const { watch } = useFormContext();
  const currentValue = watch(field.hqlName);
  const currentIdentifier = watch(field.hqlName + '_identifier');

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    if (currentValue && currentIdentifier) {
      result.push({
        id: currentValue,
        label: currentIdentifier,
      });
    }

    records.forEach(record => {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label && id !== currentValue) {
        result.push({ id, label });
      }
    });

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);

  return <Select name={field.hqlName} options={options} onFocus={refetch} isReadOnly={isReadOnly} />;
};
