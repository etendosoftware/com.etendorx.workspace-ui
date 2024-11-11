import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export const IconSize = 16;

export interface ToolbarProps {
  windowId: string;
  tabId?: string;
}

export type IconName = 'plus' | 'save' | 'trash' | 'refresh' | 'search' | 'grid' | 'download' | 'paperclip';

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
