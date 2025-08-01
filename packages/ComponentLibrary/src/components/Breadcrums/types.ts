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
  handleHomeNavigation: () => void;
  separator?: React.ReactNode;
}

export interface BreadcrumbItemProps {
  item: BreadcrumbItem;
  breadcrumbsSize: number;
  position: number;
  handleActionMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, actions: BreadcrumbAction[]) => void;
  handleHomeNavigation: () => void;
}
