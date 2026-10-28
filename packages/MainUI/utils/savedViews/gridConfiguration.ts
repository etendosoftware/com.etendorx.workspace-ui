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
 * Durable, per-user column configuration of the grids (classic `OBUIAPP_GridConfiguration`):
 * visibility, order, width, pinning and sorting of each tab, stored server-side in one AD_Preference per
 * user and window. The window store stays the source of truth while the window is open; this
 * module only restores it when the window opens and saves it after the user changes the columns.
 */

import type {
  MRT_ColumnPinningState,
  MRT_ColumnSizingState,
  MRT_SortingState,
  MRT_VisibilityState,
} from "material-react-table";
import {
  fetchGridConfiguration,
  saveGridConfiguration,
  type WindowGridConfiguration,
} from "@workspaceui/api-client/src/api/gridConfiguration";
import { useWindowStore } from "@/stores/windowStore";
import { logger } from "@/utils/logger";
import { getUserPinnedColumns, hasUserPinnedColumns, withFixedPinnedColumns } from "@/utils/table/columnState";
import type { TableState } from "@/utils/window/constants";
import { getWindowIdFromIdentifier } from "@/utils/window/utils";
import { registerSessionReset } from "@/utils/session/resetSessionState";

/** Column configuration of one tab, as stored in the preference. */
export interface ColumnConfiguration {
  version: 1;
  visibility: MRT_VisibilityState;
  order: string[];
  /** Absent when no column was resized. */
  sizing?: MRT_ColumnSizingState;
  /** Columns the user pinned (never the fixed ones); absent when none was pinned. */
  pinning?: MRT_ColumnPinningState;
  /** Sorted columns (classic view state `sort`); absent when the grid is not sorted. */
  sorting?: MRT_SortingState;
}

/** Delay before a change is stored, so a burst of changes (dragging, several clicks) makes a single request. */
export const GRID_CONFIGURATION_SAVE_DELAY_MS = 1000;

const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
const windowConfigurations = new Map<string, Promise<WindowGridConfiguration<ColumnConfiguration>>>();

const getTabKey = (windowIdentifier: string, tabId: string) => `${windowIdentifier}_${tabId}`;

/** Builds the stored configuration of a tab from its table state, omitting the parts left at their defaults. */
export const buildColumnConfiguration = (table: TableState): ColumnConfiguration => {
  const sizing = table.sizing ?? {};
  const pinning = table.pinning ?? {};
  const sorting = table.sorting ?? [];
  return {
    version: 1,
    visibility: table.visibility,
    order: table.order,
    ...(Object.keys(sizing).length > 0 && { sizing }),
    ...(hasUserPinnedColumns(pinning) && { pinning: getUserPinnedColumns(pinning) }),
    ...(sorting.length > 0 && { sorting }),
  };
};

/**
 * Table fields to apply for a stored configuration: missing parts fall back to the defaults. The
 * sorting is only replaced when it was stored, so the grid otherwise keeps its default sort.
 */
export const toColumnTableState = (configuration: ColumnConfiguration): Partial<TableState> => ({
  visibility: configuration.visibility ?? {},
  order: configuration.order ?? [],
  sizing: configuration.sizing ?? {},
  pinning: withFixedPinnedColumns(configuration.pinning ?? {}),
  ...(configuration.sorting && { sorting: configuration.sorting }),
});

const fetchWindowConfiguration = async (windowIdentifier: string) => {
  try {
    const response = await fetchGridConfiguration<ColumnConfiguration>(getWindowIdFromIdentifier(windowIdentifier));
    return response.configuration ?? {};
  } catch (error) {
    logger.warn("[gridConfiguration] Failed to load the grid configuration:", error);
    return {};
  }
};

/**
 * Loads the stored configuration of a tab. All the tabs of an open window share a single request;
 * a failure behaves as "nothing stored", so the grid keeps its metadata defaults.
 */
export const loadTabColumnConfiguration = async (
  windowIdentifier: string,
  tabId: string
): Promise<ColumnConfiguration | null> => {
  let request = windowConfigurations.get(windowIdentifier);
  if (!request) {
    request = fetchWindowConfiguration(windowIdentifier);
    windowConfigurations.set(windowIdentifier, request);
  }
  const configuration = await request;
  return configuration[tabId] ?? null;
};

const cancelPendingSave = (key: string) => {
  clearTimeout(pendingSaves.get(key));
  pendingSaves.delete(key);
};

// Both caches belong to the user who is logging out: the configurations are their preferences
registerSessionReset(() => {
  for (const key of pendingSaves.keys()) {
    cancelPendingSave(key);
  }
  windowConfigurations.clear();
});

const storeTabConfiguration = async (
  windowIdentifier: string,
  tabId: string,
  configuration: ColumnConfiguration | null
) => {
  try {
    await saveGridConfiguration(getWindowIdFromIdentifier(windowIdentifier), tabId, configuration);
  } catch (error) {
    logger.error("[gridConfiguration] Failed to store the grid configuration:", error);
  }
};

const flushSave = (windowIdentifier: string, tabId: string) => {
  pendingSaves.delete(getTabKey(windowIdentifier, tabId));
  const table = useWindowStore.getState().windows[windowIdentifier]?.tabs[tabId]?.table;
  if (!table) return;
  storeTabConfiguration(windowIdentifier, tabId, buildColumnConfiguration(table));
};

/**
 * Stores the current column configuration of a tab after the user changed it. Debounced per tab:
 * the request reads the store when it runs, so it always sends the latest state.
 */
export const scheduleGridConfigurationSave = (windowIdentifier: string, tabId: string): void => {
  const key = getTabKey(windowIdentifier, tabId);
  cancelPendingSave(key);
  pendingSaves.set(
    key,
    setTimeout(() => flushSave(windowIdentifier, tabId), GRID_CONFIGURATION_SAVE_DELAY_MS)
  );
};

/** Removes the stored configuration of a tab (back to the standard view), discarding any pending save. */
export const clearGridConfiguration = (windowIdentifier: string, tabId: string): Promise<void> => {
  cancelPendingSave(getTabKey(windowIdentifier, tabId));
  return storeTabConfiguration(windowIdentifier, tabId, null);
};
