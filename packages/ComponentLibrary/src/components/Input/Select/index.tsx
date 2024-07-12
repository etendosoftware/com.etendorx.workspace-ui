import React, { useState } from 'react';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  FormHelperText,
  Paper,
  PaperProps,
  TextField,
  Typography,
} from '@mui/material';
import { PRIMARY_CONTRAST, styles } from './style';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ISelectInput, Option } from './types';
import './style.css';
import { theme } from '../../../theme';

const CustomPaper: React.FC<PaperProps> = props => {
  return <Paper {...props} sx={styles.optionsContainer} />;
};

const Select: React.FC<ISelectInput> = ({
  title,
  iconLeft,
  options = [],
  disabled = false,
  helperText,
  ...props
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);

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

  const handleSelectionChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: Option | null,
  ) => {
    props.onChange?.(event, value);
  };

  const getBackgroundFocus = (): string => {
    if (!focused || inputValue) {
      return 'transparent';
    }
    return PRIMARY_CONTRAST;
  };

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      sx={{
        ...styles.root,
        '& .MuiInput-root': {
          ...styles.root['& .MuiInput-root'],
          backgroundColor: getBackgroundFocus(),
        },
      }}
      InputLabelProps={{
        style: styles.labelProps,
        shrink: true,
      }}
      InputProps={{
        ...params.InputProps,
        sx: styles.props,
        startAdornment: iconLeft && iconLeft,
        endAdornment: (
          <div style={styles.buttonsContainer}>
            {params.InputProps.endAdornment}
          </div>
        ),
      }}
      label={title}
      variant="standard"
      helperText={
        <FormHelperText style={styles.helperTextContainer}>
          {helperText?.icon && helperText?.icon}
          {helperText?.label && (
            <span style={styles.helperText}>{helperText?.label}</span>
          )}
        </FormHelperText>
      }
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );

  return (
    <Autocomplete
      {...props}
      disabled={disabled}
      options={options}
      getOptionLabel={option => option.title}
      clearIcon={<CancelIcon style={styles.dropdownIcons} />}
      popupIcon={<ExpandMoreIcon style={styles.dropdownIcons} />}
      renderInput={renderInput}
      sx={styles.autocomplete}
      PaperComponent={CustomPaper}
      ListboxProps={{
        sx: styles.listBox,
      }}
      onChange={handleSelectionChange}
      renderOption={(props, option, { selected }) => (
        <li
          style={{
            ...styles.optionContainer,
            backgroundColor: selected ? PRIMARY_CONTRAST : undefined,
          }}
          {...props}>
          <Typography
            className="textOption"
            color={
              selected
                ? theme.palette.dynamicColor.dark
                : theme.palette.baselineColor.neutral[90]
            }
            style={styles.optionText}>
            {option.title}
          </Typography>
          {selected && <CheckCircleIcon style={styles.checkIcon} />}
        </li>
      )}
    />
  );
};

export default Select;
