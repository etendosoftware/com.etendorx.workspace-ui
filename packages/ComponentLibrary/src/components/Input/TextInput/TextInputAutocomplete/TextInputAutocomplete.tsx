'use client';

import { useState, useEffect, KeyboardEvent, useCallback } from 'react';
import { TextField, InputAdornment, IconButton, Box, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterIcon from '@mui/icons-material/FilterList';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { TextInputProps } from './TextInputComplete.types';
import { DEFAULT_CONSTANTS } from './TextInputAutocomplete.constants';
import SuggestionBox from './SuggestionBox';
import { SmartButton } from '@mui/icons-material';
import { useStyle } from './TextInputAutocomplete.styles';

const TextInputAutoComplete = (props: TextInputProps) => {
  const {
    value,
    setValue,
    autoCompleteTexts = [],
    fetchSuggestions,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    ...textFieldProps
  } = props;

  const [loading, setLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [smartIconActive, setSmartIconActive] = useState(false);
  const [activeIcon, setActiveIcon] = useState('');
  const theme = useTheme();
  const { sx, styles, gradients } = useStyle();

  const getIconStyle = (iconName: string) => ({
    backgroundColor:
      activeIcon === iconName
        ? theme.palette.dynamicColor.main
        : isFocused
          ? theme.palette.baselineColor.neutral[0]
          : 'transparent',
    color: activeIcon === iconName ? theme.palette.dynamicColor.contrastText : theme.palette.baselineColor.neutral[70],
    borderRadius: '50%',
    width: '2rem',
    height: '2rem',
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: theme.palette.dynamicColor.main,
      color: theme.palette.dynamicColor.contrastText,
    },
  });

  const handleIconClick = useCallback((iconName: string) => {
    setActiveIcon(prevIcon => (prevIcon === iconName ? '' : iconName));
  }, []);

  const handleSmartIconClick = useCallback(() => {
    setSmartIconActive(prev => !prev);
    setActiveIcon(prev => (prev === 'smart' ? '' : 'smart'));
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setSmartIconActive(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (fetchSuggestions) {
        setLoading(true);
        await fetchSuggestions(value);
        setLoading(false);
      } else if (value) {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), DEFAULT_CONSTANTS.TIMEOUT_DURATION);
        return () => clearTimeout(timer);
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [value, fetchSuggestions]);

  useEffect(() => {
    if (autoCompleteTexts && isFocused && value) {
      const match = autoCompleteTexts.find(text => text.toLowerCase().startsWith(value.toLowerCase()));
      setSuggestion(match && match.toLowerCase() !== value.toLowerCase() ? match : '');
    } else {
      setSuggestion('');
    }
  }, [value, isFocused, autoCompleteTexts]);

  const handleClear = useCallback(() => {
    setValue?.('');
    setSuggestion('');
  }, [setValue]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        setValue?.(suggestion);
        setSuggestion('');
      }
    },
    [suggestion, setValue],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue?.(e.target.value);
      textFieldProps.onChange?.(e);
    },
    [setValue, textFieldProps],
  );

  const renderStartAdornment = () => {
    let iconElement;

    if (loading) {
      iconElement = (
        <CircularProgress
          sx={{ color: theme.palette.baselineColor.neutral[80] }}
          size={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_SIZE}
          thickness={DEFAULT_CONSTANTS.CIRCULAR_PROGRESS_THICKNESS}
        />
      );
    } else if (leftIcon) {
      iconElement = (
        <IconButton onClick={onLeftIconClick} sx={{ color: theme.palette.baselineColor.neutral[70] }}>
          {leftIcon}
        </IconButton>
      );
    } else {
      iconElement = (
        <SearchIcon
          sx={{
            color:
              isFocused && value.length > 0 ? theme.palette.dynamicColor.main : theme.palette.baselineColor.neutral[70],
          }}
        />
      );
    }

    return (
      <InputAdornment position="start">
        <Box sx={sx.startAdornment}>{iconElement}</Box>
      </InputAdornment>
    );
  };

  const renderEndAdornment = () =>
    rightIcon &&
    !props.disabled && (
      <InputAdornment position="end">
        {value && (
          <IconButton onClick={handleClear} sx={sx.clearButtonHover}>
            <CloseIcon sx={{ color: theme.palette.baselineColor.neutral[70] }} />
          </IconButton>
        )}
        <Box sx={sx.containerIcon}>
          <IconButton
            onClick={() => {
              handleIconClick('smart');
              handleSmartIconClick();
            }}
            sx={getIconStyle('smart')}>
            <SmartButton />
          </IconButton>
          <IconButton onClick={() => handleIconClick('filter')} sx={getIconStyle('filter')}>
            <FilterIcon />
          </IconButton>
        </Box>
      </InputAdornment>
    );

  const textFieldSx = {
    ...styles.inputCommon,
    opacity: props.disabled ? 0.4 : 1,
    backgroundColor: theme.palette.baselineColor.neutral[0],
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: smartIconActive ? 'transparent' : theme.palette.baselineColor.neutral[20],
        border: smartIconActive ? '2px solid' : undefined,
        borderImage: smartIconActive ? `${gradients.linearGradient} 1` : undefined,
        background: smartIconActive ? gradients.linearGradient : undefined,
        WebkitMask: `${gradients.webkitMaskGradient}`,
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        transition: 'border-color 0.5s',
        borderRadius: '6.25rem',
      },
      '&:hover fieldset': {
        borderWidth: props.disabled ? undefined : 2,
        borderColor: props.disabled ? undefined : theme.palette.baselineColor.neutral[100],
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.dynamicColor.main,
      },
      '&.Mui-focused': {
        backgroundColor: value ? theme.palette.baselineColor.neutral[0] : theme.palette.dynamicColor.contrastText,
        borderRadius: '12.25rem',
      },
    },
    ...props.sx,
  };

  return (
    <Box sx={sx.containerBox}>
      <Box sx={sx.innerBox}>
        <TextField
          placeholder={props.placeholder}
          onBlur={handleBlur}
          variant="outlined"
          fullWidth
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          disabled={props.disabled}
          InputProps={{
            ...textFieldProps.InputProps,
            sx: {
              ...sx.input,
              '& .MuiOutlinedInput-input': {
                '&::placeholder': {
                  color: theme.palette.baselineColor.transparentNeutral[70],
                  opacity: isFocused ? 0 : 1,
                  transition: `opacity ${DEFAULT_CONSTANTS.PLACEHOLDER_OPACITY_TRANSITION_DURATION}s`,
                },
              },
              ...props.InputProps?.sx,
            },
            startAdornment: renderStartAdornment(),
            endAdornment: renderEndAdornment(),
          }}
          {...textFieldProps}
          sx={textFieldSx}
          inputProps={{
            ...props.inputProps,
            style: {
              ...styles.inputProps,
              ...props.inputProps?.style,
            },
          }}
        />
        {suggestion && <SuggestionBox suggestion={suggestion} value={value} />}
      </Box>
    </Box>
  );
};

export default TextInputAutoComplete;
