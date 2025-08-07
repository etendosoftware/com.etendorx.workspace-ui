/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Section } from '@workspaceui/mainui/components/Form/FormView/types';
import type { BaseFieldDefinition, FieldDefinition } from '@workspaceui/api-client/src/api/types';

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
