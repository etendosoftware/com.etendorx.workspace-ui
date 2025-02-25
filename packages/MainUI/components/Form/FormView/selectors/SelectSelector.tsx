import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import Select, { SelectProps } from './components/Select';
import { useEffect, useMemo } from 'react';
import { useComboSelect } from '@workspaceui/etendohookbinder/src/hooks/useComboSelect';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { buildPayloadByInputName } from '@/utils';

export const SelectSelector = ({ field }: { field: Field }) => {
  const { register, getValues } = useFormContext();
  const { window, tab } = useMetadataContext();
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;

  const params = useMemo(() => ({ ...buildPayloadByInputName(getValues(), tab?.fields) }), [getValues, tab?.fields]);

  useEffect(() => {
    console.debug(params);
  }, [params]);

  const { records } = useComboSelect(field, params);

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
