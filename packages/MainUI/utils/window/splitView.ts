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

import type { CSSProperties } from "react";
import { UIPattern, type Tab } from "@workspaceui/api-client/src/api/types";
import type { SplitViewState } from "@/utils/window/constants";

/**
 * The four ways a tab can lay out its grid and form panes.
 *
 * `SPLIT` is the state introduced by ETP-4643: grid and form on screen at the
 * same time, separated by a draggable divider.
 */
export const TAB_VIEW_MODES = {
  GRID: "grid",
  FORM: "form",
  SPLIT: "split",
  TREE_SIDE_BY_SIDE: "treeSideBySide",
} as const;

export type TabViewMode = (typeof TAB_VIEW_MODES)[keyof typeof TAB_VIEW_MODES];

/** Grid pane width, as a percentage of the panes container, when split view opens. */
export const SPLIT_DEFAULT_TABLE_WIDTH = 50;
export const SPLIT_MIN_TABLE_WIDTH = 20;
export const SPLIT_MAX_TABLE_WIDTH = 80;

/**
 * CSS custom property holding the grid pane width while in split view.
 * The divider writes it directly on the panes container during a drag so that
 * dragging never re-renders the (very large) table component.
 */
export const SPLIT_TABLE_WIDTH_CSS_VAR = "--split-table-width";

/**
 * Shared fallback for tabs whose state predates split view (recovered windows
 * build their tabs without it). Frozen and module-level so it keeps a stable
 * identity and is safe to return from a zustand selector.
 */
export const DEFAULT_SPLIT_STATE: SplitViewState = Object.freeze({
  enabled: false,
  tableWidth: SPLIT_DEFAULT_TABLE_WIDTH,
});

/**
 * Keeps a grid pane width inside the supported range.
 * Non-finite input (NaN from a bad drag computation) falls back to the default.
 */
export const clampSplitTableWidth = (width: number): number => {
  if (!Number.isFinite(width)) {
    return SPLIT_DEFAULT_TABLE_WIDTH;
  }
  if (width < SPLIT_MIN_TABLE_WIDTH) {
    return SPLIT_MIN_TABLE_WIDTH;
  }
  if (width > SPLIT_MAX_TABLE_WIDTH) {
    return SPLIT_MAX_TABLE_WIDTH;
  }
  return width;
};

/**
 * Split view is meaningless on Single-Record / EDIT_ONLY tabs: they auto-open
 * the form and their grid never holds more than the record already shown.
 */
export const isSplitViewAvailable = (tab: Pick<Tab, "uIPattern">): boolean => {
  return tab.uIPattern !== UIPattern.EDIT_ONLY;
};

/**
 * Resolves the layout of a tab from the three independent flags that drive it.
 *
 * Split takes precedence over the tree side-by-side layout: when the user has
 * explicitly asked for the resizable split, their proportion wins. Tree mode
 * itself is unaffected — the grid still renders as a tree via `isTreeMode`.
 */
export const getTabViewMode = ({
  shouldShowForm,
  isSplitEnabled,
  isTreeSideBySide,
}: {
  shouldShowForm: boolean;
  isSplitEnabled: boolean;
  isTreeSideBySide: boolean;
}): TabViewMode => {
  if (!shouldShowForm) {
    return TAB_VIEW_MODES.GRID;
  }
  if (isSplitEnabled) {
    return TAB_VIEW_MODES.SPLIT;
  }
  if (isTreeSideBySide) {
    return TAB_VIEW_MODES.TREE_SIDE_BY_SIDE;
  }
  return TAB_VIEW_MODES.FORM;
};

/** True when the grid pane is actually on screen (i.e. not covered by the form). */
export const isGridPaneVisible = (mode: TabViewMode): boolean => {
  return mode !== TAB_VIEW_MODES.FORM;
};

/** True when the grid pane is the only thing on screen. */
export const isGridPaneExclusive = (mode: TabViewMode): boolean => {
  return mode === TAB_VIEW_MODES.GRID;
};

export const getPanesContainerClassName = (mode: TabViewMode): string => {
  if (mode === TAB_VIEW_MODES.SPLIT) {
    return "flex flex-1 min-h-0 flex-row";
  }
  if (mode === TAB_VIEW_MODES.TREE_SIDE_BY_SIDE) {
    return "flex flex-1 min-h-0 flex-row gap-2";
  }
  return "flex flex-1 min-h-0 relative flex-col";
};

export const getGridPaneClassName = (mode: TabViewMode, focusBorderColor: string): string => {
  if (mode === TAB_VIEW_MODES.SPLIT) {
    return "h-full min-h-0 overflow-hidden rounded-l-3xl shrink-0";
  }
  if (mode === TAB_VIEW_MODES.TREE_SIDE_BY_SIDE) {
    return "w-[35%] h-full min-h-0 overflow-hidden rounded-l-3xl";
  }
  if (mode === TAB_VIEW_MODES.GRID) {
    return `flex-1 h-full min-h-0 rounded-l-3xl transition-[border-left-color] duration-200 border-l-4 ${focusBorderColor}`;
  }
  return "absolute top-0 left-0 w-full h-full invisible opacity-0 z-[-1] pointer-events-none";
};

/**
 * In split view the grid width is driven by a CSS variable so that dragging the
 * divider is a pure style mutation. Every other mode sizes itself with classes.
 */
export const getGridPaneStyle = (mode: TabViewMode): CSSProperties | undefined => {
  if (mode !== TAB_VIEW_MODES.SPLIT) {
    return undefined;
  }
  return { width: `var(${SPLIT_TABLE_WIDTH_CSS_VAR})` };
};

export const getFormPaneClassName = (isFocused: boolean): string => {
  const borderColor = getFocusBorderColor(isFocused);
  return `flex-1 h-full min-h-0 min-w-0 relative z-10 transition-[border-left-color] duration-200 border-l-4 ${borderColor}`;
};

export const getFocusBorderColor = (isFocused: boolean): string => {
  if (isFocused) {
    return "border-l-[var(--color-secondary-500)]";
  }
  return "border-l-transparent";
};

/**
 * Record the form pane must switch to so that it keeps following the grid
 * selection, or `undefined` when it must stay where it is.
 *
 * In split view Classic turns a single row click into a record load
 * (`boostedui.js` reroutes `rowClick` to `rowDoubleClick` while the form is
 * showing), so selecting a row — by click or by keyboard — is enough to load it.
 * Pending edits and a new record still being filled in are never discarded.
 */
export const resolveSplitViewFormRecord = ({
  isSplitView,
  selectedRecordId,
  currentRecordId,
  hasFormChanges,
  isNewRecord,
}: {
  isSplitView: boolean;
  selectedRecordId: string | undefined;
  currentRecordId: string;
  hasFormChanges: boolean;
  isNewRecord: boolean;
}): string | undefined => {
  if (!isSplitView || !selectedRecordId) {
    return undefined;
  }
  if (selectedRecordId === currentRecordId) {
    return undefined;
  }
  if (hasFormChanges || isNewRecord) {
    return undefined;
  }
  return selectedRecordId;
};

/** Inline style that seeds the grid-width CSS variable on the panes container. */
export const getPanesContainerStyle = (tableWidth: number): CSSProperties => {
  return { [SPLIT_TABLE_WIDTH_CSS_VAR]: `${tableWidth}%` } as CSSProperties;
};
