import { memo } from 'react';
import { TextField } from '@mui/material';
import { NumberSelectorProps } from '../types';

const NumberSelector = memo(({ name, value, readOnly, onChange }: NumberSelectorProps) => (
  <TextField
    fullWidth
    margin="normal"
    name={name.toString()}
    type="number"
    value={value}
    onChange={e => onChange(name, Number(e.target.value))}
    disabled={readOnly}
  />
));

NumberSelector.displayName = 'NumberSelector';

export default NumberSelector;
