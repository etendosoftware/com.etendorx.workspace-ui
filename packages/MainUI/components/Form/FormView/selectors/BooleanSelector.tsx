import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { Switch } from './components/Switch';
import { useCallback } from 'react';

export const BooleanSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { watch, register, setValue } = useFormContext();
  const value = watch(field.hqlName);

  const handleChange = useCallback(
    (newValue: boolean) => {
      setValue(field.hqlName, newValue);
    },
    [field.hqlName, setValue],
  );

  return <Switch {...register(field.hqlName)} field={field} checked={value} onCheckedChange={handleChange} disabled={isReadOnly} />;
};
