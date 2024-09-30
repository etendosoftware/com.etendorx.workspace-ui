import React, { memo } from 'react';
import { TextField, styled } from '@mui/material';
import { DateSelectorProps } from '../types';

const CustomDatePicker = styled(TextField)({
  '& input[type="date"]::-webkit-calendar-picker-indicator': {
    cursor: 'pointer',
  },
});

const DateSelector: React.FC<DateSelectorProps> = memo(
  ({ name, value, onChange }) => (
    <CustomDatePicker
      fullWidth
      name={name}
      type="date"
      value={value}
      onChange={e => onChange(name, e.target.value)}
    />
  ),
);

export default DateSelector;
