import { memo, useRef } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarIcon from '../../../assets/icons/calendar.svg';
import IconButton from '../../IconButton';
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

const INPUT_LABEL_PROPS = { shrink: true } as const;

const DateSelector = memo(
  ({ label, name, value, onChange, onBlur, readOnly, required, error, helperText }: DateSelectorProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (newValue) {
        const [year, month, day] = newValue.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        onChange({
          target: {
            name,
            value: formattedDate,
          },
        });
      } else {
        onChange(event);
      }
    };

    const handleIconClick = () => {
      if (inputRef.current && !readOnly) {
        inputRef.current.showPicker();
      }
    };

    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return '';
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    };

    return (
      <StyledTextField
        fullWidth
        label={label}
        name={name}
        type="date"
        variant="standard"
        margin="normal"
        value={formatDateForInput(value)}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={readOnly}
        required={required}
        error={error}
        helperText={helperText}
        inputRef={inputRef}
        InputLabelProps={INPUT_LABEL_PROPS}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleIconClick} disabled={readOnly} height={16} width={16}>
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
