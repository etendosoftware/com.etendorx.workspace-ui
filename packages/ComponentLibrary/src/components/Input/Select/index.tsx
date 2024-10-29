import React, { useState } from 'react';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  FormHelperText,
  InputAdornment,
  Paper,
  PaperProps,
  TextField,
  Tooltip,
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

type OptionProps = React.HTMLAttributes<HTMLLIElement> & { key?: string };

const Select: React.FC<ISelectInput> = ({ title, iconLeft, options = [], disabled = false, helperText, ...props }) => {
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

  const handleSelectionChange = (event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    props.onChange?.(event, value);
  };

  const getBackgroundFocus = (): string => {
    if (!focused || inputValue) {
      return 'transparent';
    }
    return PRIMARY_CONTRAST;
  };

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <Tooltip title={inputValue} arrow>
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
          startAdornment: iconLeft && <InputAdornment position="start">{iconLeft}</InputAdornment>,
          endAdornment: <div style={styles.buttonsContainer}>{params.InputProps.endAdornment}</div>,
        }}
        label={title}
        variant="standard"
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
        clearIcon={<CancelIcon style={styles.dropdownIcons} />}
        popupIcon={<ExpandMoreIcon style={styles.dropdownIcons} />}
        renderInput={renderInput}
        sx={styles.autocomplete}
        PaperComponent={CustomPaper}
        ListboxProps={{
          sx: styles.listBox,
        }}
        onChange={handleSelectionChange}
        renderOption={(props: OptionProps, option, { selected }) => {
          const { key, ...otherProps } = props;
          return (
            <li
              key={key}
              style={{
                ...styles.optionContainer,
                backgroundColor: selected ? PRIMARY_CONTRAST : undefined,
              }}
              {...otherProps}>
              <Typography
                className="textOption"
                color={selected ? theme.palette.dynamicColor.dark : theme.palette.baselineColor.neutral[90]}
                style={styles.optionText}>
                {option.title}
              </Typography>
              {selected && <CheckCircleIcon style={styles.checkIcon} />}
            </li>
          );
        }}
      />
      {helperText && (
        <FormHelperText component="div" style={styles.helperTextContainer}>
          {helperText.icon}
          {helperText.label && <span style={styles.helperText}>{helperText.label}</span>}
        </FormHelperText>
      )}
    </>
  );
};

export default Select;
