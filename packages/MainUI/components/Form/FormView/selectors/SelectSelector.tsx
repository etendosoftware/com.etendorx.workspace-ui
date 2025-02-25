import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import Select, { SelectProps } from './components/Select';
import { useMemo } from 'react';
import { useComboSelect } from '@workspaceui/etendohookbinder/src/hooks/useComboSelect';

export const SelectSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();
  const { records } = useComboSelect(field);
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    records.forEach(record => {
      const option = {
        id: record[idKey] as string,
        label: record[identifierKey] as string,
      };

      result.push(option);
    });

    return result;
  }, [idKey, identifierKey, records]);

  return <Select {...register(field.hqlName)} name={field.hqlName} options={options} />;
};
