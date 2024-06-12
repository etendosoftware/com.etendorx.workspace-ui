import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { TextInputProps } from '../TextInputAutocomplete/TextInputComplete.types';
import { inputBaseStyles } from './TextInputBase.styles';

const TextInputBase = (props: TextInputProps) => {
  const { value, setValue, label, leftIcon, rightIcon, onLeftIconClick, onRightIconClick, type, ...otherProps } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue?.(event.target.value);
  };

  return (
    <>
      <style>{inputBaseStyles.cssStyles}</style>
      <TextField
        id="input-base"
        variant="standard"
        required
        fullWidth
        value={value}
        onChange={handleChange}
        InputLabelProps={{
          htmlFor: 'input-base',
          id: 'input-base-label',
        }}
        label={label}
        type={type}
        InputProps={{
          startAdornment: leftIcon && (
            <InputAdornment position="start" sx={inputBaseStyles.inputAdornment}>
              <IconButton
                aria-label="left icon"
                onClick={onLeftIconClick}
                size="small"
              >
                {leftIcon}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: rightIcon && (
            <InputAdornment position="end" sx={inputBaseStyles.inputAdornment}>
              <IconButton
                aria-label="right-icon"
                onClick={onRightIconClick}
                size="small"
              >
                {rightIcon}
              </IconButton>
            </InputAdornment>
          ),
          style: inputBaseStyles.inputStyle,
        }}
        sx={inputBaseStyles.inputBase}
        placeholder={props.placeholder}
        {...otherProps}
      />
    </>
  );
};

export default TextInputBase;
