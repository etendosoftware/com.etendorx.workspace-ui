'use client';

import { useState, useEffect, KeyboardEvent, useCallback } from 'react';
import { TextField, InputAdornment, Box, useTheme } from '@mui/material';
import { TextInputProps } from './TextInputComplete.types';
import { DEFAULT_CONSTANTS } from './TextInputAutocomplete.constants';
import SuggestionBox from './SuggestionBox';
import { useStyle } from './TextInputAutocomplete.styles';

import SmartButton from '../../../../assets/icons/box.svg';
import SearchIcon from '../../../../assets/icons/search.svg';
import FilterIcon from '../../../../assets/icons/filter.svg';
import CloseIcon from '../../../../assets/icons/menu-close.svg';
import IconButton from '../../../IconButton';

const TextInputAutoComplete = (props: TextInputProps) => {
  const { value, setValue, autoCompleteTexts = [], rightIcon, onLeftIconClick, ...textFieldProps } = props;

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [smartIconActive, setSmartIconActive] = useState(false);
  const theme = useTheme();
  const { sx, styles, gradients } = useStyle();

  const handleSmartIconClick = useCallback(() => {
    setSmartIconActive(prev => !prev);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setSmartIconActive(false);
  }, []);

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
    return (
      <IconButton
        className={`[&>svg]:w-4 [&>svg]:h-4 w-6 h-6 mr-2 bg-transparent hover:bg-transparent hover:text- ${value && isFocused ? 'text-(--color-dynamic-main)' : ''}`}
        onClick={onLeftIconClick}>
        <SearchIcon />
      </IconButton>
    );
  };

  const renderEndAdornment = () =>
    rightIcon &&
    !props.disabled && (
      <InputAdornment position="end">
        {value && (
          <IconButton onClick={handleClear}>
            <CloseIcon />
          </IconButton>
        )}
        <Box sx={sx.containerIcon}>
          <IconButton
            onClick={() => {
              handleSmartIconClick();
            }}>
            <SmartButton />
          </IconButton>
          <IconButton>
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
