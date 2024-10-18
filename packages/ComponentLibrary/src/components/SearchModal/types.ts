import { ReactNode } from 'react';

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
  numberOfItems?: number;
  isLoading?: boolean;
}

export interface DefaultContent {
  headerTitle: string;
  sections: Section[];
}

export interface SearchModalProps {
  defaultContent?: DefaultContent;
  tabsContent?: TabContent[];
  variant: 'default' | 'tabs';
  modalWidth?: string;
}
export interface DefaultContentProps {
  sections: Section[];
}

export interface TabContentProps {
  tabsContent: TabContent[];
  activeTab: number;
}
