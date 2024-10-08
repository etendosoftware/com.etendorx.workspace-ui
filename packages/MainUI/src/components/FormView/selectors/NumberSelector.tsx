import { memo } from 'react';
import { TextField } from '@mui/material';
import { NumberSelectorProps } from '../types';

const NumberSelector: React.FC<NumberSelectorProps> = memo(
  ({ name, value, readOnly, onChange }) => (
    <TextField
      fullWidth
      margin="normal"
      name={name}
      type="number"
      value={value}
      onChange={e => onChange(name, Number(e.target.value))}
      disabled={readOnly}
    />
  ),
);

export default NumberSelector;
