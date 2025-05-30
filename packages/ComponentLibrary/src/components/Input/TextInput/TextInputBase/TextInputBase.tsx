import type React from "react";
import { TextField, InputAdornment } from "@mui/material";
import type { TextInputProps } from "../TextInputAutocomplete/TextInputComplete.types";
import { useStyle } from "./TextInputBase.styles";
import IconButton from "../../../IconButton";
const TextInputBase = (props: TextInputProps) => {
  const {
    value,
    setValue,
    label,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    onRightIconClick,
    type,
    disabled,
    readOnly,
    ...otherProps
  } = props;
  const { styles, sx, cssString } = useStyle();

  const isDisabled = disabled || readOnly;

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
        disabled={isDisabled}
        InputLabelProps={{
          htmlFor: props.name,
        }}
        label={label}
        type={type}
        InputProps={{
          name: props.name,
          startAdornment: leftIcon && (
            <InputAdornment position="start" sx={styles.inputAdornment}>
              <IconButton aria-label="left icon" onClick={onLeftIconClick}>
                {leftIcon}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: rightIcon && (
            <InputAdornment position="end" sx={styles.inputAdornment}>
              <IconButton aria-label="right-icon" onClick={onRightIconClick}>
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
