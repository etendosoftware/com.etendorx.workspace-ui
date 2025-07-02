"use client";

import { useCallback, useState } from "react";
import { Icon, useTheme } from "@mui/material";
import { VisibilityOutlined, VisibilityOffOutlined } from "@mui/icons-material";
import TextInputBase from "../TextInputBase";
import type { TextInputProps } from "../../TextInputAutocomplete/TextInputComplete.types";

const InputPassword = (props: TextInputProps) => {
  const theme = useTheme();
  const { value, setValue, label, leftIcon, onLeftIconClick, ...otherProps } = props;

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClickShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleMouseDownPassword = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  return (
    <TextInputBase
      value={value}
      setValue={setValue}
      label={label}
      leftIcon={leftIcon}
      onLeftIconClick={onLeftIconClick}
      type={showPassword ? "text" : "password"}
      rightIcon={
        <Icon
          aria-label="toggle password visibility"
          onClick={handleClickShowPassword}
          onMouseDown={handleMouseDownPassword}
          sx={{ color: theme.palette.baselineColor.neutral[60] }}>
          {showPassword ? <VisibilityOutlined sx={{ width: 20 }} /> : <VisibilityOffOutlined sx={{ width: 20 }} />}
        </Icon>
      }
      {...otherProps}
    />
  );
};

export default InputPassword;
