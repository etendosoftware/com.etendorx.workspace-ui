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
  /** Option unique identifier */
  id: string;
  /** Option image */
  img: string | React.ReactNode;
  /** Option label */
  label?: string;
}

export interface SectionDisplayOptions {
  /** Number of items to display per row */
  itemsPerRow: number;
  /** Hide the radio button selection indicator */
  hideRadioButton?: boolean;
  /** Hide the item label text */
  hideItemLabel?: boolean;
}

export interface ISection {
  /** Section unique identifier */
  id: string;
  /** Section name */
  name: string;
  /** Section items */
  items: SectionItem[];
  /** Selected item index */
  selectedItem: number;
  /** Section is disabled */
  isDisabled?: boolean;
  /** Info text to display in tooltip */
  info?: string;
  /** Display options for section UI customization */
  displayOptions?: SectionDisplayOptions;
}

export interface OptionSelectedProps {
  /** Option unique identifier */
  id: string;
  /** Section unique identifier */
  sectionId: string;
  /** Section index */
  sectionIndex: number;
  /** Image index */
  imageIndex: number;
}

export interface IConfigurationModalProps extends Omit<MenuProps, "open" | "title"> {
  /** Button icon */
  icon?: React.ReactNode;
  /** Modal title */
  title?: { icon?: string | React.ReactNode; label?: string };
  /** Tooltip for the button */
  tooltipButtonProfile?: string;
  /** Link title */
  linkTitle?: { url?: string; label?: string };
  /** Sections to display */
  sections?: ISection[];
  /** Modal open state */
  open?: boolean;
  /** Callback function when an option is selected */
  onChangeSelect?: (optionSelected: OptionSelectedProps) => void;
}
