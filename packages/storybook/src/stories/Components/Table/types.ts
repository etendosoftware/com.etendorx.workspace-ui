import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
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
  type: string;
  id: string;
  parentId: string | null;
}

export type OrganizationLabels = {
  [K in keyof Organization]: string;
};
export interface TableProps {
  data: Organization[];
  isTreeStructure?: boolean;
  customLabels?: Record<string, string>;
}

export interface SidebarContentProps {
  icon: React.ReactNode;
  identifier: string | null;
  title: string | null;
  widgets: Widget[];
  onClose: () => void;
}
export interface Widget extends React.PropsWithChildren {
  id: string;
  title?: string;
  icon?: React.ReactNode;
  iconButtonAction?: () => void;
  tooltip?: string;
  color?: string;
  bgcolor?: string;
  size?: 'half' | 'full';
  iconBgColor?: string;
  iconButtonColor?: string;
  iconButtonHoverColor?: string;
  iconButtonBgColor?: string;
  iconButtonHoverBgColor?: string;
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
  noIdentifierLabel?: string;
  noTitleLabel?: string;
}

export interface ToolbarButton {
  key: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  fill?: string;
  hoverFill?: string;
  width?: number;
  height?: number;
  sx?: SxProps<Theme>;
}

export interface ToolbarSectionConfig {
  buttons: ToolbarButton[];
  style?: React.CSSProperties;
  isItemSelected?: boolean;
}

export interface TopToolbarProps {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
  isItemSelected: boolean;
}
