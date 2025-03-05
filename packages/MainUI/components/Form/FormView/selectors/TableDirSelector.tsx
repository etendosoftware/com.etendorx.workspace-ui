import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import Select, { SelectProps } from '@/components/Form/FormView/selectors/components/Select';
import { logger } from '@/utils/logger';

export const TableDirSelector = ({ field, tab }: { field: Field; tab?: Tab }) => {
  const { register } = useFormContext();
  const { records } = useTableDirDatasource({ field, tab });
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    try {
      records.forEach(record => {
        const id: string = record[idKey];
        const label: string = record[identifierKey];

        if (id && label) {
          result.push({ id, label });
        }
      });
    } catch (err) {
      logger.warn(err);
    }

    return result;
  }, [idKey, identifierKey, records]);

  return <Select {...register(field.hqlName)} name={field.hqlName} options={options} />;
};
