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

import type { StandardTextFieldProps, FormControlOwnProps } from "@mui/material";

export interface TextInputProps extends StandardTextFieldProps {
  value: string;
  setValue?: (value: string) => void;
  label?: string;
  autoCompleteTexts?: string[];
  fetchSuggestions?: (query: string) => Promise<void>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  placeholder?: string | undefined;
  margin?: FormControlOwnProps["margin"];
  disabled?: boolean;
  readOnly?: boolean;
}
