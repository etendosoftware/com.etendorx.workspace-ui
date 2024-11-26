import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';

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

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
}

export interface ProcessResponse {
  response: {
    status: number;
    error?: {
      message: string;
    };
    data?: unknown;
  };
}

export interface ProcessButtonProps {
  button: ProcessButton;
  onClick: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

interface BaseButton {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
}

export interface StandardButton extends BaseButton {
  icon: IconName;
  iconText?: string;
  fill?: string;
  height?: number;
  width?: number;
}

export interface ProcessButton extends BaseButton {
  processId: string;
  buttonText: string;
  displayLogic?: string;
  processInfo: {
    _entityName: string;
    id: string;
    name: string;
    javaClassName: string;
    parameters: Array<{
      defaultValue: string;
      id: string;
      name: string;
    }>;
  };
}

export type Button = StandardButton | ProcessButton;

export interface ToolbarResponse {
  response: {
    buttons: Button[];
    windowId: string;
    isNew: boolean;
  };
}

export const isProcessButton = (button: Button): button is ProcessButton => {
  return button.action === 'PROCESS';
};

interface ButtonConfigBase {
  key: string;
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export interface StandardButtonConfig extends ButtonConfigBase {
  icon: React.ReactNode;
  iconText?: string;
  fill?: string;
  height?: number;
  width?: number;
}

export interface ProcessButtonConfig extends ButtonConfigBase {
  customComponent: () => React.ReactElement;
}

export type ButtonConfig = StandardButtonConfig | ProcessButtonConfig;

export interface ToolbarSection {
  buttons: ButtonConfig[];
  style?: React.CSSProperties;
}
