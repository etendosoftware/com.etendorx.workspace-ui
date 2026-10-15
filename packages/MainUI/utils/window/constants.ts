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
  MRT_VisibilityState,
  MRT_ColumnFiltersState,
  MRT_SortingState,
  MRT_ColumnSizingState,
  MRT_ColumnPinningState,
} from "material-react-table";
import type { TabFormState } from "@/utils/url/constants";
import type { SummaryType } from "@/components/Table/HeaderContextMenu";

export const WINDOW_PROPERTY_NAMES = {
  TITLE: "title",
  IS_ACTIVE: "isActive",
  WINDOW_IDENTIFIER: "windowIdentifier",
  TABS: "tabs",
  INITIALIZED: "initialized",
} as const;

export type WindowPropertyName = (typeof WINDOW_PROPERTY_NAMES)[keyof typeof WINDOW_PROPERTY_NAMES];

export interface TableState {
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
  isImplicitFilterApplied: boolean | undefined;
  advancedCriteria?: any;
  /** Column ids the grid is grouped by (classic `groupByFields`); absent or empty when ungrouped. */
  grouping?: string[];
  /** Column widths the user set, keyed by column id (classic field `width`); absent when none was resized. */
  sizing?: MRT_ColumnSizingState;
  /** Pinned columns (classic field `frozen`), including the fixed selection and actions ones; absent by default. */
  pinning?: MRT_ColumnPinningState;
  /** Summary function of each column (classic view state `summaryFunctions`); absent when there is none. */
  summaries?: Record<string, SummaryType>;
}

/** Height of a child tab level, as a percentage of the viewport, when the user never resized it. */
export const DEFAULT_SPLIT_HEIGHT = 50;

export interface NavigationState {
  activeLevels: number[];
  activeTabsByLevel: Map<number, string>;
  initialized: boolean;
  /**
   * Height of each child tab level (the parent/child split), as a percentage of the viewport and
   * keyed by tab level. A level without entry uses DEFAULT_SPLIT_HEIGHT.
   */
  splitHeights?: Record<number, number>;
}

/**
 * Split view (grid + form side by side) preference of a tab.
 *
 * Session-scoped on purpose: Classic does not persist this either (the
 * boosted-ui module that provides the split has no personalization hooks), so
 * it is deliberately kept out of saved views and out of the URL.
 */
export interface SplitViewState {
  /** Keep the grid on screen while a form is open. */
  enabled: boolean;
  /** Grid pane width, as a percentage of the panes container. */
  tableWidth: number;
}

export interface TabState {
  table: TableState;
  form: TabFormState;
  /** Optional: tabs restored from URL recovery are built without it. */
  split?: SplitViewState;
  level: number;
  selectedRecord?: string;
  initializedWithDirectLink?: boolean;
  /**
   * Ids of the form sections the user currently has expanded. Kept per tab so the
   * preference survives FormView unmounting (grid → form → grid → form).
   * - undefined: no preference yet, the fieldGroupCollapsed metadata seeds it.
   * - []: a real preference (the user collapsed everything), never re-seeded.
   */
  expandedSections?: string[];
}

export interface WindowState {
  windowId: string;
  windowIdentifier: string;
  title: string;
  isActive: boolean;
  initialized: boolean;
  navigation: NavigationState;
  tabs: {
    [tabId: string]: TabState;
  };
  /** Set only on the in-app tabs that embed an External menu entry: the URL they show. */
  externalUrl?: string;
}

export interface WindowContextState {
  [windowIdentifier: string]: WindowState;
}
export interface WindowRecoveryInfo {
  windowIdentifier: string;
  tabId?: string;
  recordId?: string;
  hasRecoveryData: boolean;
}

// Recovery state constants
export const RECOVERY_STATE = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type RecoveryState = (typeof RECOVERY_STATE)[keyof typeof RECOVERY_STATE];
