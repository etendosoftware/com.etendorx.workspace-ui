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
import { VisibilityOutlined, VisibilityOffOutlined } from "@mui/icons-material";
import TextInputBase from "../TextInputBase";
import type { TextInputProps } from "../../TextInputAutocomplete/TextInputComplete.types";

const DEFAULT_SHOW_PASSWORD_LABEL = "Show password";
const DEFAULT_HIDE_PASSWORD_LABEL = "Hide password";
/** The icon takes the color of its button, so it keeps its contrast on hover and in dark mode. */
const VISIBILITY_ICON_SX = { width: 20, color: "inherit" } as const;

export interface InputPasswordProps extends TextInputProps {
  /** Accessible name of the toggle while the password is hidden. */
  showPasswordLabel?: string;
  /** Accessible name of the toggle while the password is visible. */
  hidePasswordLabel?: string;
}

const InputPassword = (props: InputPasswordProps) => {
  const {
    value,
    setValue,
    label,
    leftIcon,
    onLeftIconClick,
    showPasswordLabel = DEFAULT_SHOW_PASSWORD_LABEL,
    hidePasswordLabel = DEFAULT_HIDE_PASSWORD_LABEL,
    ...otherProps
  } = props;

  const [showPassword, setShowPassword] = useState<boolean>(false);

  // The handler lives on the adornment button, so Enter and Space toggle it as well as a click.
  const handleClickShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
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
        showPassword ? (
          <VisibilityOutlined sx={VISIBILITY_ICON_SX} />
        ) : (
          <VisibilityOffOutlined sx={VISIBILITY_ICON_SX} />
        )
      }
      onRightIconClick={handleClickShowPassword}
      rightIconAriaLabel={showPassword ? hidePasswordLabel : showPasswordLabel}
      rightIconPressed={showPassword}
      {...otherProps}
    />
  );
};

export default InputPassword;
