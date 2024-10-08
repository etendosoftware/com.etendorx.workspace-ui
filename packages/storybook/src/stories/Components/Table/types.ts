import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import {
  FieldDefinition,
  BaseFieldDefinition,
  Section,
} from '../../../../../MainUI/src/screens/Form/types';

export type OrganizationField = FieldDefinition | Section;

export interface Organization {
  id: BaseFieldDefinition<string>;
  documentNo: BaseFieldDefinition<string>;
  transactionDocument: BaseFieldDefinition<string>;
  _noteSection: Section;
  [key: string]: FieldDefinition | Section;
}

export type OrganizationLabels = {
  [K in keyof Organization]: string;
};

export interface SelectedRecord {
  identifier: string;
  type: string;
}
export interface TableProps {
  data: Organization[];
  isTreeStructure?: boolean;
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
}

export interface ToolbarButton {
  key: string;
  icon: React.ReactNode;
  iconText?: string;
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
  fill?: string;
  hoverFill?: string;
  height?: number;
  width?: number;
  sx?: SxProps<Theme>;
}

export interface ToolbarSectionConfig {
  buttons: ToolbarButton[];
  style?: React.CSSProperties;
  isItemSelected?: boolean;
  toggleExpand?: (event?: React.MouseEvent<HTMLElement>) => void;
}

export interface TopToolbarProps {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
  isItemSelected: boolean;
}
