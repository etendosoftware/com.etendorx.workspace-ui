import { MRT_TableInstance } from 'material-react-table';
export interface Organization {
  identificator: string;
  name: string;
  description: string;
  active: boolean;
  groupLevel: boolean;
  socialName: string;
  organizationType: string;
  currency: string;
  allowPeriodControl: boolean;
  calendar: 'Spain' | 'USA' | 'LATAM';
  files: number;
  tags: string[];
  reactions: number;
  id: string;
  parentId: string | null;
}

export type OrganizationLabels = {
  [K in keyof Organization]: string;
};

export interface ToolbarButtonConfig {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}

export interface TableProps {
  data: Organization[];
  isTreeStructure?: boolean;
  customLabels?: Record<string, string>;
}
export interface TopToolbarProps {
  table: MRT_TableInstance<Organization>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}
export interface TopToolbarProps {
  table: MRT_TableInstance<Organization>;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  isItemSelected: boolean;
}

export interface SidebarContentProps {
  icon: React.ReactNode;
  identifier: string | null;
  title: string | null;
  widgets: Widget[];
  onClose: () => void;
}
export interface Widget {
  id: string;
  content: React.ReactNode;
  size: string;
}

export interface ContentGridProps {
  widgets: Widget[];
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: {
    icon: React.ReactNode;
    identifier: string | null;
    title: string | null;
  };
  widgets: Widget[];
}

export interface RightSectionProps {
  table: MRT_TableInstance<Organization>;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  searchPlaceholder?: string;
}
