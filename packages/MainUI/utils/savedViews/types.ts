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

import type {
  MRT_ColumnFiltersState,
  MRT_ColumnPinningState,
  MRT_ColumnSizingState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";
import type { SummaryType } from "@/components/Table/HeaderContextMenu";

/**
 * Window layout stored with a view (classic view definition `window` entry: parent/child tab set
 * state and height).
 */
export interface WindowLayout {
  /** Height of each child tab level, as a percentage of the viewport, keyed by tab level. */
  splitHeights: Record<string, number>;
  /**
   * Tab levels shown when the view was saved (at most two, as in classic: the parent and the child
   * tab sets). `[parent, child]` is the split, a single level is that level maximized.
   */
  activeLevels?: number[];
}

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
  implicitFilterApplied: boolean;
  /** Grouped column ids; absent in views saved before grouping existed or saved ungrouped. */
  grouping?: string[];
  /** Column widths; absent in views saved before widths were stored or without resized columns. */
  sizing?: MRT_ColumnSizingState;
  /** Columns the user pinned (never the fixed ones); absent when none was pinned. */
  pinning?: MRT_ColumnPinningState;
  /** Window layout; absent in views saved before the layout was stored. */
  layout?: WindowLayout;
  /** Summary function of each column (classic `summaryFunctions`); absent when there is none. */
  summaries?: Record<string, SummaryType>;
  /** The grid is shown as a tree (classic `viewMode: 'tree'`); absent for the flat grid. */
  treeView?: boolean;
}

/** Grid and window state captured into a view, or applied from one. */
export interface ViewStateSnapshot {
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
  implicitFilterApplied: boolean;
  grouping?: string[];
  sizing?: MRT_ColumnSizingState;
  pinning?: MRT_ColumnPinningState;
  layout?: WindowLayout;
  summaries?: Record<string, SummaryType>;
  treeView?: boolean;
}

/** State applied from a view: every grid field resolved to a value, the layout absent when the view has none. */
export interface AppliedViewState extends ViewStateSnapshot {
  grouping: string[];
  sizing: MRT_ColumnSizingState;
  pinning: MRT_ColumnPinningState;
  summaries: Record<string, SummaryType>;
  treeView: boolean;
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
 * The visibility scope of a saved view, most specific first. USER views are private to
 * their owner; ROLE/ORGANIZATION/CLIENT/SYSTEM views are shared defaults an administrator
 * defined for everyone at that level. The effective default for a tab is resolved
 * server-side with USER > ROLE > ORGANIZATION > CLIENT > SYSTEM precedence.
 */
export type SavedViewScope = "USER" | "ROLE" | "ORGANIZATION" | "CLIENT" | "SYSTEM";

/**
 * A single saved view record from the ETMETA_SavedView entity.
 */
export interface SavedView {
  id: string;
  name: string;
  tabId: string;
  isDefault: boolean;
  filterClause: string;
  gridConfiguration: string;
  scope: SavedViewScope;
  /** Whether the current user is allowed to rename/delete/re-default this view. */
  editable: boolean;
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
  scope: SavedViewScope;
  editable: boolean;
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
  /** Omit for a personal (USER-scope) view — only administrators may set a shared scope. */
  scope?: SavedViewScope;
  /** Target role id, only used when scope is "ROLE"; defaults to the caller's current role. */
  roleId?: string;
}

/**
 * Raw response record from the datasource fetch for ETMETA_SavedView.
 */
export interface RawSavedViewRecord {
  id: string;
  tab?: string;
  tab$_identifier?: string;
  user?: string;
  role?: string;
  name?: string;
  isdefault?: boolean;
  filterclause?: string;
  gridconfiguration?: string;
  scope?: string;
  editable?: boolean;
  [key: string]: unknown;
}
