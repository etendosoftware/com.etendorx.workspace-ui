import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import Select, { SelectProps } from './components/Select';
import { useMemo } from 'react';

export const ListSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  const options = useMemo<SelectProps['options']>(() => {
    if (field.refList) {
      return Array.from(field.refList).map(item => ({
        id: item.value,
        label: item.label,
      }));
    }

    return [];
  }, [field.refList]);

  return <Select {...register(field.hqlName)} name={field.hqlName} options={options} />;
};
