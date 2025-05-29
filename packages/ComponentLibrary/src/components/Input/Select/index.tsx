'use client';

import type React from 'react';
import { useState } from 'react';
import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  FormHelperText,
  InputAdornment,
  Paper,
  type PaperProps,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useStyle } from './style';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ISelectInput, Option } from './types';
import Tooltip from '../../Tooltip';

type OptionProps = React.HTMLAttributes<HTMLLIElement> & { key?: string };

const Select: React.FC<ISelectInput> = ({
  title,
  iconLeft,
  options = [],
  disabled = false,
  helperText,
  name,
  ...props
}) => {
  const { sx } = useStyle();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);

  const CustomPaper: React.FC<PaperProps> = paperProps => {
    return <Paper {...paperProps} sx={sx.optionsContainer} />;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    setInputValue('');
  };

  const handleSelectionChange = (event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    props.onChange?.(event, value);
  };

  const getBackgroundFocus = (): string => {
    if (!focused || inputValue) {
      return 'transparent';
    }
    return theme.palette.baselineColor.neutral[0];
  };

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <Tooltip title={inputValue}>
      <TextField
        {...params}
        sx={{
          ...sx.root,
          '& .MuiInput-root': {
            ...sx.root['& .MuiInput-root'],
            backgroundColor: getBackgroundFocus(),
          },
        }}
        InputLabelProps={{
          style: sx.labelProps,
          shrink: true,
        }}
        InputProps={{
          ...params.InputProps,
          name,
          sx: sx.props,
          startAdornment: iconLeft && <InputAdornment position="start">{iconLeft}</InputAdornment>,
          endAdornment: <div style={sx.buttonsContainer}>{params.InputProps.endAdornment}</div>,
        }}
        label={title}
        variant="standard"
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        name={name}
      />
    </Tooltip>
  );

  return (
    <>
      <Autocomplete
        {...props}
        disabled={disabled}
        options={options}
        getOptionLabel={option => option.title}
        clearIcon={<CancelIcon style={sx.dropdownIcons} />}
        popupIcon={<ExpandMoreIcon style={sx.dropdownIcons} />}
        renderInput={renderInput}
        sx={sx.autocomplete}
        PaperComponent={CustomPaper}
        ListboxProps={{
          sx: sx.listBox,
        }}
        onChange={handleSelectionChange}
        renderOption={({ key, ...restProps }: OptionProps, option, { selected }) => {
          return (
            <li
              key={option.value + key}
              style={{
                ...sx.optionContainer,
                backgroundColor: selected ? theme.palette.baselineColor.neutral[0] : undefined,
              }}
              {...restProps}>
              <Typography
                className="textOption"
                color={selected ? theme.palette.dynamicColor.dark : theme.palette.baselineColor.neutral[90]}
                style={sx.optionText}>
                {option.title}
              </Typography>
              {selected && <CheckCircleIcon style={sx.checkIcon} />}
            </li>
          );
        }}
      />
      {helperText && (
        <FormHelperText component="div" style={sx.helperTextContainer}>
          {helperText.icon}
          {helperText.label && <span style={sx.helperText}>{helperText.label}</span>}
        </FormHelperText>
      )}
    </>
  );
};

export default Select;
