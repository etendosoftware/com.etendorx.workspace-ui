export interface TabItem {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  fill?: string;
  hoverFill?: string;
  showInTab?: 'icon' | 'label' | 'both' | boolean;
}

export interface PrimaryTabsProps {
  icon: string | React.ReactNode;
  tabs: TabItem[];
  onChange?: (tabId: string) => void;
  selectedTab?: string;
}
