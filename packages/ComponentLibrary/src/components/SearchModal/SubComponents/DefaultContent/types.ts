import type { ReactNode } from 'react';

export interface Item {
  name: string;
  icon: ReactNode;
  isNew?: boolean;
  newLabel?: string;
}

export interface Section {
  title: string;
  items: Item[];
}

export interface TabContent {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  items: Item[];
}

export interface SearchModalProps {
  defaultContent?: Section[];
  tabsContent: TabContent[];
  variant: 'default' | 'tabs';
}

export interface DefaultContentProps {
  sections: Section[];
}

export interface TabContentProps {
  tabsContent: TabContent[];
  activeTab: number;
}
