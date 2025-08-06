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

import type { SxProps, Theme } from "@mui/material";
import type { ProcessButton } from "../ProcessModal/types";

export const IconSize = "1rem";

export interface Position {
  top: string;
  right: string;
}

export interface SearchPortalProps {
  isOpen: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  position?: Position;
  width?: string;
  autoCompleteTexts?: string[];
  theme?: Theme;
}

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
  onSearch?: (value: string) => void;
  isFormView?: boolean;
}
export interface ProcessResponse {
  success: boolean;
  message?: string;
  popupOpened?: boolean;
  redirected?: boolean;
  frameUrl?: string;
  redirectUrl?: string;
  showInIframe?: boolean;
  showDeprecatedFeatureModal?: boolean;
  responseActions?: Array<{
    showMsgInProcessView?: {
      msgType: string;
      msgTitle: string;
      msgText: string;
    };
  }>;
  refreshParent?: boolean;
}

export interface ProcessButtonProps {
  button: ProcessButton;
  onClick: () => void;
  disabled?: boolean;
}

export interface ProcessMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  processButtons: ProcessButton[];
  onProcessClick: (button: ProcessButton) => void;
  selectedRecord: unknown | undefined;
}

export interface BasicToolbarButton {
  key: string;
  onClick: ((event: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
  disabled?: boolean;
}

export interface ToolbarButton extends BasicToolbarButton {
  icon: React.ReactNode;
  iconText?: string;
  tooltip?: string;
  fill?: string;
  hoverFill?: string;
  height?: number | string;
  width?: number | string;
  sx?: SxProps<Theme>;
  className?: string;
  anchorEl?: HTMLElement | null;
}

export interface ProcessAvailableButton extends BasicToolbarButton {
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  text: string;
  customContainerStyles?: string;
  customTextStyles?: string;
  anchorEl?: HTMLElement | null;
}

export interface ToolbarSectionConfig {
  buttons: ToolbarButton[];
  style?: React.CSSProperties;
  toggleExpand?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  processButton?: ProcessAvailableButton;
}

export interface TopToolbarProps {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
  processButton: ProcessAvailableButton;
}
