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
  icon: React.ReactNode | string | ((props: { style?: React.CSSProperties }) => React.ReactElement);
  label: string;
  onClick: () => void;
  items: Item[];
  numberOfItems?: number;
  isLoading?: boolean;
  content?: ReactNode;
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

export interface SecondaryTabsProps {
  content: TabContent[];
  selectedTab: number;
  onChange: (newValue: number) => void;
}
