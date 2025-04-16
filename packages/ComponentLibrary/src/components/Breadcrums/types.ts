export interface BreadcrumbAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  toggle?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  onClick?: () => void;
  actions?: BreadcrumbAction[];
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onHomeClick: () => void;
  homeIcon?: React.ReactNode | string;
  homeText?: string;
  separator?: React.ReactNode;
  activeTabId?: string;
  onTabChange: () => void;
}
