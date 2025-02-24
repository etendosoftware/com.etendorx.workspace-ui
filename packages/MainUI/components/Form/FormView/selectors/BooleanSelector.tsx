import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { Switch } from './components/Switch';
import { useCallback } from 'react';

export const BooleanSelector = ({ field }: { field: Field }) => {
  const { watch, register, setValue } = useFormContext();
  const value = watch(field.hqlName);

  const handleChange = useCallback(
    (newValue: boolean) => {
      console.debug(newValue);
      setValue(field.hqlName, newValue);
    },
    [field.hqlName, setValue],
  );

  return <Switch {...register(field.hqlName)} checked={value} onCheckedChange={handleChange} />;
};
