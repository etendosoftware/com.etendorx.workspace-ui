import type { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useController, useFormContext } from 'react-hook-form';
import { Switch } from './components/Switch';

export const BooleanSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { control } = useFormContext();

  const {
    field: { value = false, onChange },
  } = useController({
    name: field.hqlName,
    control,
    defaultValue: false,
  });

  return <Switch checked={!!value} onCheckedChange={onChange} field={field} disabled={isReadOnly} />;
};
