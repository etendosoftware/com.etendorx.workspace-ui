import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
export interface FieldDefinition<T> {
  value: T;
  type: FieldType;
  label: string;
}

export interface Organization {
  organization: FieldDefinition<string>;
  id: FieldDefinition<string>;
  documentNo: FieldDefinition<string>;
  transactionDocument: FieldDefinition<string>;
  orderDate: FieldDefinition<string>;
  businessPartner: FieldDefinition<string>;
  partnerAddress: FieldDefinition<string>;
  priceList: FieldDefinition<string>;
  scheduledDeliveryDate: FieldDefinition<string>;
  paymentMethod: FieldDefinition<string>;
  paymentTerms: FieldDefinition<string>;
  warehouse: FieldDefinition<string>;
  invoiceTerms: FieldDefinition<string>;
  orderReference: FieldDefinition<string>;
  salesRepresentative: FieldDefinition<string>;
  description: FieldDefinition<string>;
  invoiceAddress: FieldDefinition<string>;
  deliveryLocation: FieldDefinition<string>;
  quotation: FieldDefinition<string>;
  cancelledorder: FieldDefinition<string>;
  replacedorder: FieldDefinition<string>;
  iscancelled: FieldDefinition<boolean>;
  externalBusinessPartnerReference: FieldDefinition<string>;
  project: FieldDefinition<string>;
  costcenter: FieldDefinition<string>;
  asset: FieldDefinition<string>;
  stDimension: FieldDefinition<string>;
  ndDimension: FieldDefinition<string>;
  creationDate: FieldDefinition<string>;
  createdBy: FieldDefinition<string>;
  updated: FieldDefinition<string>;
  updatedBy: FieldDefinition<string>;
  documentStatus: FieldDefinition<string>;
  grandTotalAmount: FieldDefinition<number>;
  summedLineAmount: FieldDefinition<number>;
  currency: FieldDefinition<string>;
  reservationStatus: FieldDefinition<string>;
  deliveryStatus: FieldDefinition<string>;
  invoiceStatus: FieldDefinition<string>;
  delivered: FieldDefinition<boolean>;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

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
