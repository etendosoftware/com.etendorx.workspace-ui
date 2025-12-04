/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
            <InputAdornment position="start" sx={sx.inputAdornment}>
              <IconButton aria-label="left icon" onClick={onLeftIconClick}>
                {leftIcon}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: rightIcon && (
            <InputAdornment position="end" sx={sx.inputAdornment}>
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
