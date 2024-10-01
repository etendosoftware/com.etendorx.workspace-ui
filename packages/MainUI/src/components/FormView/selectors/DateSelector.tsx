import { memo, useRef } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarIcon from '../../../../../ComponentLibrary/src/assets/icons/calendar.svg';
import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import { DateSelectorProps } from '../types';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius,
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 0, 1, 1.5),
    margin: 0,
    '&::-webkit-calendar-picker-indicator': {
      display: 'none',
    },
  },
}));

const DateSelector: React.FC<DateSelectorProps> = memo(
  ({ name, value, onChange, readOnly }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(name, event.target.value);
    };

    const handleIconClick = () => {
      if (inputRef.current) {
        inputRef.current.showPicker();
      }
    };

    return (
      <StyledTextField
        fullWidth
        name={name}
        type="date"
        variant="standard"
        value={value || ''}
        onChange={handleChange}
        disabled={readOnly}
        inputRef={inputRef}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleIconClick}
                disabled={readOnly}
                height={16}
                width={16}>
                <CalendarIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  },
);

export default DateSelector;
