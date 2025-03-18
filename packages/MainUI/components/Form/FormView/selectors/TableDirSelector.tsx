import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from './components/Select';
import { useMemo } from 'react';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import { SelectProps } from './components/types';
import { useFormContext } from 'react-hook-form';

export const TableDirSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;
  const { records, refetch } = useTableDirDatasource({ field });
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

      if (id && label) {
        result.push({ id, label });
      }
    });

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);

  return <Select name={field.hqlName} options={options} onFocus={refetch} isReadOnly={isReadOnly} />;
};
