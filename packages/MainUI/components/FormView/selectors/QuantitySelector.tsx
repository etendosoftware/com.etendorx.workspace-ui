import React, { memo, useState, useCallback, useEffect } from 'react';
import { TextField } from '@mui/material';
import { QuantityProps } from '../types';
import { validateNumber } from '../../../utils/quantitySelectorUtil';

const INPUT_PROPS = {
  inputMode: 'numeric' as const,
  pattern: '[0-9]*',
};

const QuantitySelector: React.FC<QuantityProps> = memo(
  ({ value: initialValue, min, max, onChange, readOnly, maxLength }) => {
    const [value, setValue] = useState(initialValue);
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
      [minValue, maxValue, onChange, maxLength],
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-'].includes(event.key)) {
        event.preventDefault();
      }
    }, []);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

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
        InputProps={{
          inputProps: INPUT_PROPS,
        }}
      />
    );
  },
);

export default QuantitySelector;
