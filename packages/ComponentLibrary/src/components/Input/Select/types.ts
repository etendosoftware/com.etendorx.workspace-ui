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

import type { AutocompleteProps } from "@mui/material";
import type { Option } from "@workspaceui/api-client/src/api/types";

export type { Option };

export interface ISelectInput<T extends string = string>
  extends Omit<AutocompleteProps<Option<T>, false, false, false>, "renderInput"> {
  title?: string;
  iconLeft?: React.ReactElement;
  options: Option<T>[];
  disabled?: boolean;
  helperText?: {
    label?: string;
    icon?: React.ReactElement;
  };
  value?: Option<T> | null;
  name?: string;
  onChange?: (event: React.SyntheticEvent<Element, Event>, value: Option<T> | null) => void;
}
