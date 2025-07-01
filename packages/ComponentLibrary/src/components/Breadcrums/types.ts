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
  separator?: React.ReactNode;
}

export interface BreadcrumbListProps {
  items: BreadcrumbItem[];
  handleActionMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, actions: BreadcrumbAction[]) => void;
}

export interface BreadcrumbItemProps {
  item: BreadcrumbItem;
  isLast: boolean;
  handleActionMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, actions: BreadcrumbAction[]) => void;
}
