import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export interface SelectedRecord {
  identifier?: string | null;
  type?: string | null;
  [key: string]: unknown;
}

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
}

export interface TabContentProps {
  identifier: string | null;
  type: string | null;
  onClose: () => void;
  handleFullSize: () => void;
  isFullSize: boolean;
  tab?: Tab;
  selectedRecord?: SelectedRecord;
}

export interface ResizableTabContainerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord?: SelectedRecord | null;
  tab?: Tab;
  windowId: string;
  onHeightChange?: (height: number) => void;
}
