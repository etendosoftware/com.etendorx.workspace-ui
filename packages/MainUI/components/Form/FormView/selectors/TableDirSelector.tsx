import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import Select, { SelectProps } from './components/Select';
import { useMemo } from 'react';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';

export const TableDirSelector = ({ field }: { field: Field, isReadOnly: boolean }) => {
  const { register } = useFormContext();
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;

  const { records, refetch } = useTableDirDatasource({ field });

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    records.forEach(record => {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label) {
        result.push({ id, label });
      }
    });

    return result;
  }, [idKey, identifierKey, records]);

  return <Select {...register(field.hqlName)} name={field.hqlName} options={options} onFocus={refetch} />;
};
