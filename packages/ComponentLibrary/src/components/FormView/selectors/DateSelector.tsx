import { memo, useCallback, useMemo, useRef } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarIcon from '../../../assets/icons/calendar.svg';
import { DateSelectorProps } from '../types';
import IconButton from '../../IconButton';

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

const DateSelector: React.FC<DateSelectorProps> = memo(({ name, value, onChange, readOnly }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.value);
    },
    [onChange],
  );

  const handleIconClick = useCallback(() => {
    inputRef.current?.showPicker();
  }, []);

  const InputProps = useMemo(
    () => ({
      name,
      endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={handleIconClick} disabled={readOnly} height={16} width={16}>
            <CalendarIcon />
          </IconButton>
        </InputAdornment>
      ),
    }),
    [handleIconClick, name, readOnly],
  );

  return (
    <StyledTextField
      fullWidth
      name={name}
      type="date"
      variant="standard"
      margin="normal"
      value={value}
      onChange={handleChange}
      disabled={readOnly}
      inputRef={inputRef}
      InputProps={InputProps}
    />
  );
});

export default DateSelector;
