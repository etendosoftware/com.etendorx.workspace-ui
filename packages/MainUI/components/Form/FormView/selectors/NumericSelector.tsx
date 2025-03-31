import React, { useState, useEffect, useCallback } from 'react';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { TextInput } from './components/TextInput';
import { useFormContext } from 'react-hook-form';

export const NumericSelector = ({ field, ...props }: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register, setValue, watch } = useFormContext();
  const formValue = watch(field.hqlName);
  const [localValue, setLocalValue] = useState(formValue === null || formValue === undefined ? '' : String(formValue));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formValue === null || formValue === undefined ? '' : String(formValue));
    }
  }, [formValue, isFocused]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
        setLocalValue(value);

        if (props.onChange) {
          props.onChange(event);
        }
      }
    },
    [props],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      if (props.onFocus) {
        props.onFocus(event);
      }
    },
    [props],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      const value = localValue.trim();

      if (value === '') {
        setValue(field.hqlName, props.required ? 0 : null);
        setLocalValue(props.required ? '0' : '');
        return;
      }

      const normalizedValue = value.replace(',', '.');

      const numericValue = parseFloat(normalizedValue);

      if (!isNaN(numericValue)) {
        setValue(field.hqlName, numericValue);
      }

      if (props.onBlur) {
        props.onBlur(event);
      }
    },
    [localValue, field.hqlName, setValue, props],
  );

  const registerProps = register(field.hqlName);

  return (
    <TextInput
      {...props}
      field={field}
      name={registerProps.name}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      value={localValue}
      ref={registerProps.ref}
    />
  );
};
