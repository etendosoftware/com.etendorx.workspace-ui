import { Section } from '@workspaceui/mainui/components/Form/FormView/types';
import { BaseFieldDefinition, FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';
import { IconButtonProps } from '../../../../../../../src/components/IconButton';

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

export interface ToolbarButton extends IconButtonProps {
  icon: React.ReactNode;
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
