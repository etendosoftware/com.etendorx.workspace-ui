import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';

export interface TabLevelProps {
  tab: Tab;
  level: number;
  parentRecord?: EntityData;
}

export interface ErrorDisplayProps {
  title: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}
