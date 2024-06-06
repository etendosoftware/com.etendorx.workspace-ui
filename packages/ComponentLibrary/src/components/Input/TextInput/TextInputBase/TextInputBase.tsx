import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import { TextInputProps } from '../TextInputAutocomplete/TextInputComplete.types';
import { inputBaseStyles } from './TextInputBase.styles';

const TextInputBase = (props: TextInputProps) => {
  const { leftIcon, rightIcon, onLeftIconClick, onRightIconClick, ...otherProps } = props;

  const [value, setValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  return (
    <>
      <style>{inputBaseStyles.cssStyles}</style>
      <TextField
        id="password-input"
        variant="standard"
        required
        fullWidth
        value={value}
        onChange={handleChange}
        InputLabelProps={{
          htmlFor: 'password-input',
          id: 'password-input-label',
        }}
        label="Contraseña actual"
        type={showPassword ? 'text' : 'password'}
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
          endAdornment: rightIcon ? (
            <InputAdornment position="end" sx={inputBaseStyles.inputAdornment}>
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                size="small"
              >
                {showPassword ? <VisibilityOutlined sx={{ width: 20 }} /> : <VisibilityOffOutlined sx={{ width: 20 }} />}
              </IconButton>
            </InputAdornment>
          ) : (
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
        placeholder="Base Input"
        {...otherProps}
      />
    </>
  );
};

export default TextInputBase;
