import React, { memo, useState, useCallback, useEffect } from 'react';
import { TextField } from '@mui/material';
import { FieldValue, QuantityProps } from '../types';
import { validateNumber } from '@workspaceui/componentlibrary/src/utils/quantitySelectorUtil';
import { useFormContext } from 'react-hook-form';

const INPUT_PROPS = {
  inputProps: {
    inputMode: 'numeric' as const,
    pattern: '[0-9]*',
  },
};

const QuantitySelector: React.FC<QuantityProps> = memo(
  ({ value: initialValue, min, max, onChange, readOnly, maxLength = 100, name, field }) => {
    const { watch, setValue: setActualValue } = useFormContext();
    const value = watch(field.hqlName, initialValue);

    const setValue = useCallback(
      (v: FieldValue) => {
        setActualValue(field.hqlName, v);
      },
      [field.hqlName, setActualValue],
    );

    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const minValue = min !== null && min !== undefined && min !== '' ? Number(min) : undefined;
    const maxValue = max !== null && max !== undefined && max !== '' ? Number(max) : undefined;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        const sanitizedValue = inputValue.replace(/[^\d]/g, '').slice(0, Number(maxLength));

        setValue(sanitizedValue);

        if (sanitizedValue === '') {
          setError(false);
          setErrorMessage('');
          onChange?.(0);
          return;
        }

        const { isValid, errorMessage, roundedValue } = validateNumber(sanitizedValue, minValue, maxValue);
        setError(!isValid);
        setErrorMessage(errorMessage);

        if (isValid && roundedValue !== undefined) {
          onChange?.(roundedValue);
          setValue(roundedValue.toString());
        }
      },
      [maxLength, setValue, minValue, maxValue, onChange],
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(event.key)) {
        event.preventDefault();
      }
    }, []);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue, setValue]);

    return (
      <TextField
        id="outlined-number"
        type="number"
        variant="standard"
        margin="normal"
        fullWidth
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        error={error}
        helperText={error ? errorMessage : ' '}
        disabled={readOnly}
        InputProps={INPUT_PROPS}
        name={name}
        role="spinbutton"
        aria-label={field.name}
        aria-readonly={readOnly}
        aria-required={field.isMandatory}
        aria-disabled={readOnly}
        {...(typeof minValue != 'undefined' ? { 'aria-valuemin': minValue } : {})}
        {...(typeof maxValue != 'undefined' ? { 'aria-valuemax': maxValue } : {})}
      />
    );
  },
);

QuantitySelector.displayName = 'QualitySelector';

export default QuantitySelector;
