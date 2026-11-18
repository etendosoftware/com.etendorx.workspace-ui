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

/** Makes the keyboard focus of the icon buttons visible. */
const ICON_BUTTON_CLASSES =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-dynamic-main)";
const DECORATIVE_ICON_CLASSES = "inline-flex items-center justify-center w-8 h-8";

interface AdornmentIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  pressed?: boolean;
}

/**
 * Renders an input adornment icon: a focusable button when it has an action, or a decorative icon
 * outside the tab sequence otherwise.
 */
const AdornmentIcon = ({ icon, onClick, ariaLabel, pressed }: AdornmentIconProps) => {
  if (!onClick) {
    return (
      <span aria-hidden="true" className={DECORATIVE_ICON_CLASSES}>
        {icon}
      </span>
    );
  }
  return (
    <IconButton ariaLabel={ariaLabel} aria-pressed={pressed} onClick={onClick} className={ICON_BUTTON_CLASSES}>
      {icon}
    </IconButton>
  );
};

const TextInputBase = (props: TextInputProps) => {
  const {
    value,
    setValue,
    label,
    leftIcon,
    rightIcon,
    onLeftIconClick,
    onRightIconClick,
    leftIconAriaLabel = "left icon",
    rightIconAriaLabel = "right-icon",
    rightIconPressed,
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
              <AdornmentIcon icon={leftIcon} onClick={onLeftIconClick} ariaLabel={leftIconAriaLabel} />
            </InputAdornment>
          ),
          endAdornment: rightIcon && (
            <InputAdornment position="end" sx={sx.inputAdornment}>
              <AdornmentIcon
                icon={rightIcon}
                onClick={onRightIconClick}
                ariaLabel={rightIconAriaLabel}
                pressed={rightIconPressed}
              />
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
