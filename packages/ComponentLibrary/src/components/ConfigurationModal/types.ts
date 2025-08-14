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

import type { MenuProps } from "@mui/material";

export interface SectionItem {
  id: string;
  img: string | React.ReactNode;
  label?: string;
}

export interface ISection {
  id: string;
  name: string;
  items: SectionItem[];
  selectedItem: number;
  isDisabled?: boolean;
}

export interface OptionSelectedProps {
  id: string;
  sectionId: string;
  sectionIndex: number;
  imageIndex: number;
}

export interface IConfigurationModalProps extends Omit<MenuProps, "open" | "title"> {
  icon?: React.ReactNode;
  title?: { icon?: string | React.ReactNode; label?: string };
  tooltipButtonProfile?: string;
  linkTitle?: { url?: string; label?: string };
  sections?: ISection[];
  open?: boolean;
  onChangeSelect?: (optionSelected: OptionSelectedProps) => void;
}
