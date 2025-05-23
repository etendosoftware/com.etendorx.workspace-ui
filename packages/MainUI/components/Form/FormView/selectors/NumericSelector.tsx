import { useFormContext } from 'react-hook-form';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { TextInput } from './components/TextInput';
import { useCallback } from 'react';

export const NumericSelector = ({ field, ...props }: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register, setValue } = useFormContext();

  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      let value = event.target.value;

      value = value.replace(/[^\d.-]/g, '');
      value = value.replace(/(?!^)-/g, '');

      const parts = value.split('.');

      if (parts.length > 2) {
        value = parts.shift() + '.' + parts.join('');
      }

      setValue(field.hqlName, value);
    },
    [field.hqlName, setValue],
  );

  return (
    <TextInput
      {...props}
      {...register(field.hqlName)}
      inputMode="decimal"
      pattern="^-?\d*(\.\d+)?$"
      field={field}
      onChange={handleChange}
    />
  );
};
