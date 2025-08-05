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
