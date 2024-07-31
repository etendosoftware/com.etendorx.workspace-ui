import { ReactNode } from 'react';

export interface TabItem {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  fill?: string;
  hoverFill?: string;
  showInTab: 'icon' | 'label' | 'both';
}

export interface PrimaryTabsProps {
  icon: string | ReactNode;
  tabs: TabItem[];
  onChange?: (tabId: string) => void;
}
