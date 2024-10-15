import React, { memo, useState, useCallback, useEffect } from 'react';
import { TextField } from '@mui/material';
import { QuantityProps } from '../types';

const QuantitySelector: React.FC<QuantityProps> = memo(({ value: initialValue, min, max, onChange, readOnly }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const minValue = min !== null && min !== undefined && min !== '' ? Number(min) : undefined;
  const maxValue = max !== null && max !== undefined && max !== '' ? Number(max) : undefined;

  const roundNumber = useCallback((num: number) => {
    return parseInt(num.toString().replace('.', ''));
  }, []);

  const validateNumber = useCallback(
    (num: number) => {
      const roundedNum = roundNumber(num);
      if (roundedNum < 0) {
        setErrorMessage('Value must be non-negative');
        return false;
      }
      if (minValue !== undefined && roundedNum < minValue) {
        setErrorMessage(`Value must be at least ${minValue}`);
        return false;
      }
      if (maxValue !== undefined && roundedNum > maxValue) {
        setErrorMessage(`Value must be at most ${maxValue}`);
        return false;
      }
      return true;
    },
    [minValue, maxValue, roundNumber],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setValue(inputValue);

      if (inputValue === '') {
        setError(false);
        setErrorMessage('');
        onChange && onChange(0);
        return;
      }

      const numericValue = parseFloat(inputValue);
      if (isNaN(numericValue)) {
        setError(true);
        setErrorMessage('Please enter a valid number');
        return;
      }

      const isValid = validateNumber(numericValue);
      setError(!isValid);

      if (isValid) {
        const roundedValue = roundNumber(numericValue);
        onChange && onChange(roundedValue);
        setValue(roundedValue.toString());
      }
    },
    [validateNumber, roundNumber, onChange],
  );

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <TextField
      id="outlined-number"
      type="number"
      variant="standard"
      fullWidth
      value={value}
      onChange={handleChange}
      error={error}
      helperText={error ? errorMessage : ''}
      disabled={readOnly}
      InputProps={{
        inputProps: {
          min: minValue,
          max: maxValue,
        },
      }}
    />
  );
});

export default QuantitySelector;
