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
