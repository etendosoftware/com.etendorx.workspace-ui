import { ToolbarButton } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { BaseButton, ProcessButton } from '@workspaceui/componentlibrary/src/components/ProcessModal/types';

export const IconSize = 16;

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
}

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
}

export interface ProcessResponse {
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
