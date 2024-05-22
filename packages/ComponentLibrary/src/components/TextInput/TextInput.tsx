import { useState, useEffect, KeyboardEvent } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import CircularProgress from '@mui/material/CircularProgress';
import { TextInputProps } from './TextInput.types';
import { CSS_STYLES, SX_STYLES } from './TextInput.styles';
import { DEFAULT_CONSTANTS } from './TextInput.constants';
import t from './TextInput.translations.json';
import { PRIMARY_950, PRIMARY_1000, NEUTRAL_850, START_750, TERTIARY_150, NEUTRAL_50 } from '../../colors';
import SuggestionBox from './SuggestionBox';

const TextInput = (props: TextInputProps) => {
  const {
    autoCompleteTexts = [],
    fetchSuggestions,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    onRightIconClick,
    ...textFieldProps
  } = props;

  // States
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>('');

  // Fetch suggestions or simulate loading when value changes
  useEffect(() => {
    const fetchData = async () => {
      if (fetchSuggestions) {
        setLoading(true);
        await fetchSuggestions(value);
        setLoading(false);
      } else {
        if (value) {
          setLoading(true);
          const timer = setTimeout(() => {
            setLoading(false);
          }, DEFAULT_CONSTANTS.TIMEOUT_DURATION);

          return () => clearTimeout(timer);
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [value, fetchSuggestions]);

  // Update suggestion based on autocomplete texts and focus state
  useEffect(() => {
    if (autoCompleteTexts && isFocused) {
      const match = autoCompleteTexts.find(text => text.toLowerCase().startsWith(value.toLowerCase()));
      if (match && value && match.toLowerCase() !== value.toLowerCase()) {
        setSuggestion(match);
      } else {
        setSuggestion('');
      }
    }
  }, [value, isFocused, autoCompleteTexts]);

  // Clear the input and suggestion
  const handleClear = () => {
    setValue('');
    setSuggestion('');
  };

  // Handle Tab key press to accept suggestion
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setValue(suggestion);
      setSuggestion('');
    }
  };

  // Handle input change and call onChange prop if provided
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (textFieldProps.onChange) {
      textFieldProps.onChange(e);
    }
  };

  // Define input styles with conditions
  const inputStyles = {
    ...CSS_STYLES.input,
    "& .MuiOutlinedInput-input": {
      '&::placeholder': {
        color: PRIMARY_1000,
        opacity: isFocused ? 0 : 1,
        transition: `opacity ${DEFAULT_CONSTANTS.PLACEHOLDER_OPACITY_TRANSITION_DURATION}s`,
      },
    },
    ...(props.disabled && {
      pointerEvents: 'none',
    }),
    ...props.InputProps?.sx,
  };

  // Define start adornment
  const startAdornment = (
    <InputAdornment position="start">
      <Box sx={SX_STYLES.startAdornment}>
        {loading ? (
          <CircularProgress size={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_SIZE} thickness={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_THICKNESS} />
        ) : (
          leftIcon ? (
            <IconButton onClick={onLeftIconClick}>{leftIcon}</IconButton>
          ) : (
            <SearchIcon sx={{ color: !props.disabled ? isFocused && value.length === 0 ? START_750 : NEUTRAL_850 : NEUTRAL_850 }} />
          )
        )}
      </Box>
    </InputAdornment>
  );

  // Define end adornment
  const endAdornment = !props.disabled && (
    <InputAdornment sx={{ backgroundColor: "none" }} position="end">
      {value && (
        <IconButton onClick={handleClear} sx={SX_STYLES.clearButton}>
          <span style={CSS_STYLES.cleanText}>{t.clean}</span>
        </IconButton>
      )}
      {rightIcon ? (
        <IconButton onClick={onRightIconClick}>{rightIcon}</IconButton>
      ) : (
        <IconButton sx={SX_STYLES.rightButton}>
          <FilterIcon
            sx={{
              color: !props.disabled ? (isFocused && value.length === 0 ? START_750 : NEUTRAL_850) : NEUTRAL_850,
              ...SX_STYLES.iconWidth,
            }}
          />
        </IconButton>
      )}
    </InputAdornment>
  );

  // Define main TextField sx
  const textFieldSx = {
    ...CSS_STYLES.inputCommon,
    backgroundColor: !props.disabled ? NEUTRAL_50 : PRIMARY_950,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: PRIMARY_950,
      },
      '&:hover fieldset': {
        borderWidth: !isFocused ? 0 : undefined,
      },
      '&.Mui-focused fieldset': {
        borderColor: START_750,
      },
      '&.Mui-focused': {
        backgroundColor: value ? NEUTRAL_50 : TERTIARY_150,
      },
      borderRadius: '100px',
    },
    ...(props.disabled && {
      pointerEvents: 'none',
    }),
    ...props.sx,
  };

  // Define inputProps
  const inputProps = {
    ...props.inputProps,
    style: {
      ...CSS_STYLES.inputProps,
      ...props.inputProps?.style,
    },
  };

  return (
    <Box sx={SX_STYLES.containerBox}>
      <Box sx={SX_STYLES.innerBox}>
        <TextField
          placeholder="Buscar..."
          variant="outlined"
          fullWidth
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={props.disabled}
          InputProps={{
            ...textFieldProps.InputProps,
            sx: inputStyles,
            startAdornment: startAdornment,
            endAdornment: endAdornment,
          }}
          {...textFieldProps}
          sx={textFieldSx}
          inputProps={inputProps}
        />
        {suggestion && <SuggestionBox suggestion={suggestion} value={value} />}
      </Box>
    </Box>
  );
};

export default TextInput;
