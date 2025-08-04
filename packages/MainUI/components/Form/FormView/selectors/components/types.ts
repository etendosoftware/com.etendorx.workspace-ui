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

import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";

export interface TextInputProps
  extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  label?: string;
  setValue?: (value: string) => void;
  field: Field;
  endAdornment?: React.ReactNode;
  errorText?: string;
}

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Array<{ id: string; label: string; data?: EntityData }>;
  onFocus?: () => void;
  onSearch?: (term: string) => void;
  isReadOnly?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  field: Field;
}
