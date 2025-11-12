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

import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import type { TabFormState } from "@/utils/url/constants";

export const WINDOW_PROPERTY_NAMES = {
  TITLE: "title",
  IS_ACTIVE: "isActive",
  WINDOW_IDENTIFIER: "windowIdentifier",
  TABS: "tabs",
} as const;

export type WindowPropertyName = typeof WINDOW_PROPERTY_NAMES[keyof typeof WINDOW_PROPERTY_NAMES];

export interface TableState {
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
  isImplicitFilterApplied: boolean | undefined;
}

export interface NavigationState {
  activeLevels: number[];
  activeTabsByLevel: Map<number, string>;
  initialized: boolean;
}

export interface TabState {
  table: TableState;
  form: TabFormState;
  level: number;
  selectedRecord?: string;
}

export interface WindowState {
  windowId: string;
  windowIdentifier: string;
  title: string;
  isActive: boolean;
  navigation: NavigationState;
  tabs: {
    [tabId: string]: TabState;
  };
}

export interface WindowContextState {
  [windowIdentifier: string]: WindowState;
}