import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export interface TabLevelProps {
  tab: Tab;
  collapsed?: boolean;
}

export interface ErrorDisplayProps {
  title: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}
