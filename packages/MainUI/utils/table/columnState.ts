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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Grid column width and pinning helpers (classic `ob-view-grid.js` field `width` / `frozen`).
 * Everything here is pure so the grid and its hooks only wire state around it.
 */

import type {
  MRT_ColumnPinningState,
  MRT_ColumnSizingState,
  MRT_Updater,
  MRT_VisibilityState,
} from "material-react-table";
import { COLUMN_NAMES } from "@/components/Table/constants";

/** Columns always pinned to the left, in this order, whatever the user pins (selection checkbox and actions). */
export const FIXED_PINNED_COLUMNS: readonly string[] = ["mrt-row-select", COLUMN_NAMES.ACTIONS];

/** Stable empty sizing returned when no column was resized (a fresh literal breaks zustand snapshot caching). */
export const DEFAULT_COLUMN_SIZING: MRT_ColumnSizingState = {};

/** Pinning of a grid the user never customized. Stable reference for the same snapshot-caching reason. */
export const DEFAULT_COLUMN_PINNING: MRT_ColumnPinningState = { left: [...FIXED_PINNED_COLUMNS], right: [] };

/** Resolves a React-style "value or updater function" against the current value. */
export const resolveUpdater = <T>(updaterOrValue: MRT_Updater<T>, current: T): T =>
  typeof updaterOrValue === "function" ? (updaterOrValue as (previous: T) => T)(current) : updaterOrValue;

/**
 * Tells whether two visibility states are literally the same. Used to drop the `onColumnVisibilityChange`
 * calls that re-send the current state (the column menu syncs itself on mount), which are not a change
 * the user made and must not rewrite the stored configuration.
 */
export const isSameColumnVisibility = (a: MRT_VisibilityState, b: MRT_VisibilityState): boolean => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
};

const isUserColumn = (columnId: string) => !FIXED_PINNED_COLUMNS.includes(columnId);

/**
 * Normalizes a pinning state so the fixed columns always lead the left side and never appear
 * twice or on the right, whatever MRT or a stored configuration provides.
 */
export const withFixedPinnedColumns = (pinning: MRT_ColumnPinningState): MRT_ColumnPinningState => ({
  left: [...FIXED_PINNED_COLUMNS, ...(pinning.left ?? []).filter(isUserColumn)],
  right: (pinning.right ?? []).filter(isUserColumn),
});

/** Columns the user pinned, without the fixed ones. Empty sides are omitted. */
export const getUserPinnedColumns = (pinning: MRT_ColumnPinningState): MRT_ColumnPinningState => {
  const result: MRT_ColumnPinningState = {};
  const left = (pinning.left ?? []).filter(isUserColumn);
  const right = (pinning.right ?? []).filter(isUserColumn);
  if (left.length > 0) {
    result.left = left;
  }
  if (right.length > 0) {
    result.right = right;
  }
  return result;
};

/** True when the user pinned at least one column. */
export const hasUserPinnedColumns = (pinning: MRT_ColumnPinningState): boolean =>
  Object.keys(getUserPinnedColumns(pinning)).length > 0;

/**
 * Tells a user reorder apart from the order MRT sets by itself.
 *
 * MRT calls `onColumnOrderChange` on its own whenever the number of columns changes (first
 * render, columns shown or hidden by metadata), so only a change that keeps the same columns and
 * moves at least one of them is a reorder made by the user.
 */
export const isUserColumnReorder = (previous: string[], next: string[]): boolean =>
  previous.length > 0 &&
  previous.length === next.length &&
  previous.some((columnId, index) => columnId !== next[index]);
