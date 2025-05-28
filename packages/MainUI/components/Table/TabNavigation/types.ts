import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';

export interface SelectedRecord extends EntityData {
}

export type IsMainTab = boolean;

export interface TabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: SelectedRecord | null;
  noIdentifierLabel?: string;
  noTypeLabel?: string;
  handleFullSize: () => void;
  isFullSize: boolean;
  tab?: Tab;
  childTabs?: Tab[];
  windowId?: string;
  isMainTab?: IsMainTab;
}

export interface TabContentProps {
  identifier: string | null;
  type: string | null;
  onClose: () => void;
  handleFullSize: () => void;
  isFullSize: boolean;
  tab?: Tab;
  selectedRecord?: SelectedRecord;
  isMainTab?: IsMainTab;
}

export interface ResizableTabContainerProps {
  isOpen: boolean;
}
