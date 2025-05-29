import type { Section } from '@workspaceui/mainui/components/Form/FormView/types';
import type { BaseFieldDefinition, FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';

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
