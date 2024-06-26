import { useState, useEffect, KeyboardEvent } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { TextInputProps } from './TextInputComplete.types';
import { CSS_STYLES, SX_STYLES } from './TextInputAutocomplete.styles';
import { DEFAULT_CONSTANTS } from './TextInputAutocomplete.constants';
import SuggestionBox from './SuggestionBox';
import { theme } from '../../../../theme';

const TextInputAutoComplete = (props: TextInputProps) => {
  const {
    value,
    setValue,
    autoCompleteTexts = [],
    fetchSuggestions,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    onRightIconClick,
    ...textFieldProps
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>('');

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

  const handleClear = () => {
    setValue?.('');
    setSuggestion('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setValue?.(suggestion);
      setSuggestion('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue?.(e.target.value);
    if (textFieldProps.onChange) {
      textFieldProps.onChange(e);
    }
  };

  const inputStyles = {
    ...CSS_STYLES.input,
    "& .MuiOutlinedInput-input": {
      '&::placeholder': {
        color: theme.palette.baselineColor.transparentNeutral[70],
        opacity: isFocused ? 0 : 1,
        transition: `opacity ${DEFAULT_CONSTANTS.PLACEHOLDER_OPACITY_TRANSITION_DURATION}s`,
      },
    },
    ...(props.disabled && {
      pointerEvents: 'none',
    }),
    ...props.InputProps?.sx,
  };

  const startAdornment = (
    <InputAdornment position="start">
      <Box sx={SX_STYLES.startAdornment}>
        {loading ? (
          <CircularProgress size={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_SIZE} thickness={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_THICKNESS} />
        ) : (
          leftIcon ? (
            <IconButton onClick={onLeftIconClick}>{leftIcon}</IconButton>
          ) : (
            <SearchIcon sx={{ color: !props.disabled ? isFocused && value.length === 0 ? theme.palette.dynamicColor.main : theme.palette.baselineColor.transparentNeutral[5] : theme.palette.baselineColor.transparentNeutral[5] }} />
          )
        )}
      </Box>
    </InputAdornment>
  );

  const endAdornment = !props.disabled && (
    <InputAdornment position="end">
      {value && (
        <IconButton
          onClick={handleClear}
          sx={SX_STYLES.clearButtonHover}
        >
          <CloseIcon sx={SX_STYLES.iconDefault} />
        </IconButton>
      )}
      {rightIcon ? (
        <IconButton
          onClick={onRightIconClick}
          sx={SX_STYLES.rightButtonHover}
        >
          {rightIcon}
        </IconButton>
      ) : (
        <IconButton
          sx={SX_STYLES.rightButtonHover}
        >
          <FilterIcon
            sx={SX_STYLES.iconDefault}
          />
        </IconButton>
      )}
    </InputAdornment>
  );

  const textFieldSx = {
    ...CSS_STYLES.inputCommon,
    backgroundColor: !props.disabled ? theme.palette.baselineColor.neutral[0] : theme.palette.baselineColor.transparentNeutral[5],
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: theme.palette.baselineColor.transparentNeutral[5],
      },
      '&:hover fieldset': {
        borderWidth: !isFocused ? 0 : undefined,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.dynamicColor.main,
      },
      '&.Mui-focused': {
        backgroundColor: value ? theme.palette.baselineColor.neutral[0] : theme.palette.dynamicColor.contrastText,
      },
      borderRadius: '6.25rem',
    },
    ...(props.disabled && {
      pointerEvents: 'none',
    }),
    ...props.sx,
  };

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
          placeholder={props.placeholder}
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

export default TextInputAutoComplete;
