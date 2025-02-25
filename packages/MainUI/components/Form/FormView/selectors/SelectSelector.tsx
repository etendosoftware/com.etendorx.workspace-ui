import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import Select, { SelectProps } from './components/Select';
import { useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';

export const SelectSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();
  const { records } = useDatasource(field.referencedEntity);
  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    records.forEach(record => {
      result.push({
        id: record.id as string,
        label: record._identifier as string,
      });
    });

    return result;
  }, [records]);

  return <Select {...register(field.hqlName)} name={field.hqlName} options={options} />;
};
