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

import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";

/**
 * MRT-native grid configuration schema (workspace-ui format).
 * Stored in `gridConfiguration` field as JSON string.
 */
export interface MRTViewConfig {
  version: 1;
  source: "workspace-ui";
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
}

/**
 * Classic Etendo view field descriptor (for backward-compat parsing).
 */
export interface ClassicViewField {
  name: string;
  visible: boolean;
}

/**
 * Classic Etendo saved view format (OBUIAPP_SavedSearch gridConfiguration).
 * Used for parsing views created by Classic UI.
 */
export interface ClassicViewConfig {
  fields?: ClassicViewField[];
  criteria?: Array<{
    fieldName: string;
    operator: string;
    value: string;
  }>;
  sortBy?: string;
}

/**
 * A single saved view record from the OBUIAPP_SavedSearch entity.
 */
export interface SavedView {
  id: string;
  name: string;
  tabId: string;
  isDefault: boolean;
  filterClause: string;
  gridConfiguration: string;
}

/**
 * The parsed form of a SavedView (gridConfiguration deserialized).
 */
export interface ParsedSavedView {
  id: string;
  name: string;
  tabId: string;
  isDefault: boolean;
  filterClause: string;
  config: MRTViewConfig | null;
}

/**
 * Payload for creating or updating a saved view.
 */
export interface SavedViewPayload {
  tabId: string;
  name: string;
  isDefault: boolean;
  filterClause: string;
  gridConfiguration: string;
}

/**
 * Raw response record from the datasource fetch for OBUIAPP_SavedSearch.
 */
export interface RawSavedViewRecord {
  id: string;
  obuiappTab?: string;
  obuiappTab$_identifier?: string;
  name?: string;
  obuiappIsdefault?: boolean;
  obuiappFilterclause?: string;
  obuiappGridconfiguration?: string;
  [key: string]: unknown;
}
