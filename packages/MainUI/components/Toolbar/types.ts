import type { SxProps, Theme } from "@mui/material";
import type { ProcessButton } from "../ProcessModal/types";

export const IconSize = 16;

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

// Adaptador para convertir ToolbarButtonMetadata a ToolbarButton para TopToolbar
export interface ToolbarButton {
  key: string;
  icon: React.ReactNode;
  iconText?: string;
  tooltip?: string;
  onClick: ((event: React.MouseEvent<HTMLButtonElement>) => void) | (() => void);
  disabled?: boolean;
  fill?: string;
  hoverFill?: string;
  height?: number;
  width?: number;
  sx?: SxProps<Theme>;
  className?: string;
  anchorEl?: HTMLElement | null;
}

export interface ToolbarSectionConfig {
  buttons: ToolbarButton[];
  style?: React.CSSProperties;
  toggleExpand?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export interface TopToolbarProps {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
}
