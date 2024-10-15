import React, { memo, useEffect, useState, useCallback } from 'react';
import { TextField } from '@mui/material';
import { QuantityProps } from '../types';

const QuantitySelector: React.FC<QuantityProps> = memo(({ min, max }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      if (min !== undefined && roundedNum < min) {
        setErrorMessage(`Value must be at least ${min} when rounded`);
        return false;
      }
      if (max !== undefined && roundedNum > max) {
        setErrorMessage(`Value must be at most ${max} when rounded`);
        return false;
      }
      return true;
    },
    [min, max, roundNumber],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setValue(inputValue);

      if (inputValue === '') {
        setError(false);
        setErrorMessage('');
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
    },
    [validateNumber],
  );

  useEffect(() => {
    if (value !== '' && !error) {
      const roundedValue = roundNumber(parseFloat(value));
      setValue(roundedValue.toString());
    }
  }, [value, error, roundNumber]);

  return (
    <TextField
      id="outlined-number"
      label="Number"
      type="number"
      variant="standard"
      fullWidth
      value={value}
      onChange={handleChange}
      error={error}
      helperText={error ? errorMessage : ''}
    />
  );
});

export default QuantitySelector;
