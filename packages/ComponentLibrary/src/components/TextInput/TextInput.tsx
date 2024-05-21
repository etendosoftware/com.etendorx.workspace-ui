import { useState, useEffect, KeyboardEvent } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import TabIcon from '@mui/icons-material/KeyboardTab';
import CircularProgress from '@mui/material/CircularProgress';
import { TextInputProps } from './TextInput.types';
import {
  inputStyles,
  tabBoxStyles,
  tabTextStyles,
  suggestionBoxStyles,
  suggestionTextStyles,
  clearButtonStyles,
  rightButtonStyles,
  containerBoxStyles,
  innerBoxStyles,
  startAdornmentStyles,
  inputPropsStyles,
  cleanTextStyles,
  iconWidthStyle,
  inputCommonStyles,
  spanOpacityStyle,
  tabIconStyles,
} from './TextInput.styles';
import { BLACK_100, BLACK_200, GREY_50, LIGHT_BLUE_100, LIGHT_BLUE_50, WHITE_100 } from '../../styles/colors';
import { LABELS } from './TextInput.labels';
import { CONSTANTS } from './TextInput.constants';

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

  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestion, setSuggestion] = useState('');

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
          }, CONSTANTS.TIMEOUT_DURATION);

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

  return (
    <Box sx={containerBoxStyles}>
      <Box sx={innerBoxStyles}>
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
            sx: {
              ...inputStyles,
              "& .MuiOutlinedInput-input": {
                '&::placeholder': {
                  color: BLACK_200,
                  opacity: isFocused ? 0 : 1,
                  transition: `opacity ${CONSTANTS.PLACEHOLDER_OPACITY_TRANSITION_DURATION}s`,
                },
              },
              ...(props.disabled && {
                pointerEvents: 'none',
              }),
              ...props.InputProps?.sx,
            },
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={startAdornmentStyles}>
                  {loading ? (
                    <CircularProgress size={CONSTANTS.CIRCULAR_PROGRESS_SIZE} thickness={CONSTANTS.CIRCULAR_PROGRESS_THICKNESS} />
                  ) : (
                    leftIcon ? (
                      <IconButton onClick={onLeftIconClick}>{leftIcon}</IconButton>
                    ) : (
                      <SearchIcon sx={{ color: !props.disabled ? isFocused && value.length === 0 ? LIGHT_BLUE_100 : GREY_50 : GREY_50 }} />
                    )
                  )}
                </Box>
              </InputAdornment>
            ),
            endAdornment: !props.disabled && (
              <InputAdornment sx={{ backgroundColor: "none" }} position="end">
                {value && (
                  <IconButton onClick={handleClear} sx={clearButtonStyles}>
                    <span style={cleanTextStyles}>{LABELS.CLEAR}</span>
                  </IconButton>
                )}
                {rightIcon ? (
                  <IconButton onClick={onRightIconClick}>{rightIcon}</IconButton>
                ) : (
                  <IconButton sx={rightButtonStyles()}>
                    <FilterIcon
                      sx={{
                        color: !props.disabled ? (isFocused && value.length === 0 ? LIGHT_BLUE_100 : GREY_50) : GREY_50,
                        ...iconWidthStyle,
                      }}
                    />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          {...textFieldProps}
          sx={{
            ...inputCommonStyles,
            backgroundColor: !props.disabled ? WHITE_100 : BLACK_100,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderWidth: !isFocused ? 0 : undefined,
              },
              '&.Mui-focused': {
                backgroundColor: value ? WHITE_100 : LIGHT_BLUE_50,
              },
            },
            ...(props.disabled && {
              pointerEvents: 'none',
            }),
            ...props.sx,
          }}
          {...props}
          inputProps={{
            ...props.inputProps,
            style: {
              ...inputPropsStyles,
              ...props.inputProps?.style,
            },
          }}
        />
        {suggestion && (
          <Box sx={suggestionBoxStyles}>
            <span style={spanOpacityStyle}>{value}</span>
            <span style={suggestionTextStyles}>{suggestion.slice(value.length)}</span>
            <Box sx={tabBoxStyles}>
              <TabIcon sx={tabIconStyles} />
              <p style={tabTextStyles}>{LABELS.TAB}</p>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TextInput;
