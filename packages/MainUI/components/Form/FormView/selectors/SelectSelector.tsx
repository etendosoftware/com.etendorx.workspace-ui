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
  const name = field.hqlName;
  const currentValue = watch(name);
  const currentIdentifier = watch(name + '_identifier');

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

      if (id && label) {
        result.push({ id, label });
      }
    });

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);

  return <Select name={field.hqlName} options={options} onFocus={refetch} isReadOnly={isReadOnly} />;
};
