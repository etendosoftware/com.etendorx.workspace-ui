import { memo, useState, useCallback, useEffect } from 'react';
import { roundNumber, validateNumber } from '../../../utils/quantitySelectorUtil';
import { TextField } from '@mui/material';
import { QuantityProps } from '../types';

const QuantitySelector: React.FC<QuantityProps> = memo(({ value: initialValue, min, max, onChange, readOnly }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const minValue = min !== null && min !== undefined && min !== '' ? Number(min) : undefined;
  const maxValue = max !== null && max !== undefined && max !== '' ? Number(max) : undefined;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setValue(inputValue);

      if (inputValue === '') {
        setError(false);
        setErrorMessage('');
        onChange?.(0);
        return;
      }

      const numericValue = parseFloat(inputValue);
      if (isNaN(numericValue)) {
        setError(true);
        setErrorMessage('Please enter a valid number');
        return;
      }

      const { isValid, errorMessage } = validateNumber(numericValue, minValue, maxValue);
      setError(!isValid);
      setErrorMessage(errorMessage);

      if (isValid) {
        const roundedValue = roundNumber(numericValue);
        onChange?.(roundedValue);
        setValue(roundedValue.toString());
      }
    },
    [minValue, maxValue, onChange],
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
