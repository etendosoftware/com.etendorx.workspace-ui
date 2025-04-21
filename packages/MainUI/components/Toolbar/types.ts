import { ToolbarButton } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { Theme } from '@mui/material';
import { BaseButton, ProcessButton } from '../ProcessModal/types';

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

export type IconName =
  | 'plus'
  | 'save'
  | 'trash'
  | 'refresh-cw'
  | 'search'
  | 'grid'
  | 'download'
  | 'paperclip'
  | 'process';

export interface ToolbarResponseButton extends ToolbarButton {
  icon: IconName;
  key: string;
  onClick: () => void;
  name: string;
  id: string;
}

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
  onSearch?: (value: string) => void;
  isFormView?: boolean;
  onSave?: () => void;
}

export interface ProcessResponse {
  success: boolean;
  message?: string;
  popupOpened?: boolean;
  redirected?: boolean;
  frameUrl?: string;
  redirectUrl?: string;
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

export interface StandardButton extends BaseButton {
  icon: IconName;
  iconText?: string;
  fill?: string;
  height?: number;
  width?: number;
}

export interface ProcessMenuButtonConfig extends Omit<StandardButtonConfig, 'onClick'> {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export type Button = StandardButton | ProcessButton;

export const isProcessButton = (button: Button): button is ProcessButton => {
  return button.action === 'PROCESS';
};

export interface StandardButtonConfig extends ToolbarButton {
  icon: React.ReactNode;
  iconText?: string;
  fill?: string;
  height?: number;
  width?: number;
  action?: string;
  name?: string;
  enabled?: boolean;
}

export interface ProcessButtonConfig extends ToolbarButton {
  icon: React.ReactNode;
  iconText?: string;
  height?: number;
  width?: number;
  onProcess?: () => Promise<void>;
  additionalContent: () => React.ReactElement | null;
}

export type ButtonConfig = StandardButtonConfig | ProcessButtonConfig;

export interface ToolbarSection {
  buttons: ButtonConfig[];
  style?: React.CSSProperties;
}

export interface ProcessMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processButtons: any;
  onProcessClick: (button: ProcessButton) => void;
  selectedRecord: unknown | undefined;
}
