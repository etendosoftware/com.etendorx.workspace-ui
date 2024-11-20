import { SxProps } from '@mui/material';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export const IconSize = 16;

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
}

export type IconName = 'plus' | 'save' | 'trash' | 'refresh-cw' | 'search' | 'grid' | 'download' | 'paperclip';

export interface ButtonResponse {
  id: string;
  name: string;
  action: string;
  enabled: boolean;
  visible: boolean;
  icon: IconName;
}

export interface ToolbarResponse {
  response: {
    buttons: ButtonResponse[];
    windowId: string;
    isNew: boolean;
  };
}

export interface TabLevelProps {
  tab: Tab;
  level: number;
}

export interface ButtonConfig {
  key: string;
  icon: React.ReactElement;
  tooltip: string;
  onClick: () => void;
  disabled: boolean;
  height: number;
  width: number;
  fill: string;
  iconText?: string;
  sx?: SxProps;
}

export interface ErrorDisplayProps {
  title: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}
