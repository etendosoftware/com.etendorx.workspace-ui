import React from 'react';
import { TextField, InputAdornment, IconButton, useTheme } from '@mui/material';
import { TextInputProps } from '../TextInputAutocomplete/TextInputComplete.types';
import { useStyle } from './TextInputBase.styles';

const TextInputBase = (props: TextInputProps) => {
  const { value, setValue, label, leftIcon, rightIcon, onLeftIconClick, onRightIconClick, type, ...otherProps } = props;
  const theme = useTheme();
  const { styles, sx, cssString } = useStyle();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue?.(event.target.value);
  };

  return (
    <>
      <style>{cssString}</style>
      <TextField
        id={props.name}
        variant="standard"
        required
        fullWidth
        value={value}
        onChange={handleChange}
        InputLabelProps={{
          htmlFor: props.name,
        }}
        label={label}
        type={type}
        InputProps={{
          name: props.name,
          startAdornment: leftIcon && (
            <InputAdornment position="start" sx={styles.inputAdornment}>
              <IconButton
                aria-label="left icon"
                onClick={onLeftIconClick}
                size="small"
                sx={{ color: theme.palette.baselineColor.neutral[60] }}>
                {leftIcon}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: rightIcon && (
            <InputAdornment position="end" sx={styles.inputAdornment}>
              <IconButton
                aria-label="right-icon"
                onClick={onRightIconClick}
                size="small"
                sx={{ color: theme.palette.baselineColor.neutral[60] }}>
                {rightIcon}
              </IconButton>
            </InputAdornment>
          ),
          style: styles.inputStyle,
        }}
        sx={sx.inputBase}
        placeholder={props.placeholder}
        {...otherProps}
      />
    </>
  );
};

export default TextInputBase;
