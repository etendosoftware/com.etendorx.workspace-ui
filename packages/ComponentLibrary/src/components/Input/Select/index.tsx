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
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import XIcon from '../../../assets/icons/x.svg';
import CheckIcon from '../../../assets/icons/check-circle-filled.svg';
import { START_700 } from '../../../colors';
import { NEUTRAL_90 } from '../../ConfigurationModal/style';
import { ISelectInput } from './types';
import './style.css'

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
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);

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

  const handleSelectionChange = (value: any) => {
    setInputValue(value?.title || '');
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
        startAdornment: iconLeft && (
          <img alt="leftIcon" src={iconLeft} style={styles.imgIconLeft} />
        ),
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
          {helperText?.icon && (
            <img
              alt="helperIcon"
              src={helperText?.icon}
              style={styles.helperTextIcon}
            />
          )}
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
      clearIcon={
        <img alt="clearIcon" src={XIcon} style={styles.dropdownIcons} />
      }
      popupIcon={
        <img alt="popupIcon" src={ChevronDown} style={styles.dropdownIcons} />
      }
      renderInput={renderInput}
      sx={styles.autocomplete}
      PaperComponent={CustomPaper}
      ListboxProps={{
        sx: styles.listBox,
      }}
      onChange={(event, value) => handleSelectionChange(value)}
      renderOption={(props, option, { selected }) => (
        <li
          style={{
            ...styles.optionContainer,
            backgroundColor: selected ? PRIMARY_CONTRAST : undefined,
          }}
          {...props}>
          <Typography
            className="textOption"
            color={selected ? START_700 : NEUTRAL_90}
            style={styles.optionText}>
            {option.title}
          </Typography>
          {selected && (
            <img alt="selectIcon" src={CheckIcon} style={styles.checkIcon} />
          )}
        </li>
      )}
    />
  );
};

export default Select;
