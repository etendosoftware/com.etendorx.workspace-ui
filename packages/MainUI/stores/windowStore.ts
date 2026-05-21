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

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import type {
  WindowContextState,
  WindowState,
  TableState,
  NavigationState,
} from "@/utils/window/constants";
import type { TabFormState } from "@/utils/url/constants";
import { TAB_MODES } from "@/utils/url/constants";
import { getWindowIdFromIdentifier, createDefaultTabState } from "@/utils/window/utils";

// ---------------------------------------------------------------------------
// Internal helper: ensures window + tab exist in the draft (immer mutates)
// ---------------------------------------------------------------------------
function ensureTabExistsDraft(
  windows: WindowContextState,
  windowIdentifier: string,
  tabId: string,
  tabLevel = 0
): void {
  if (!windows[windowIdentifier]) {
    const windowId = getWindowIdFromIdentifier(windowIdentifier);
    windows[windowIdentifier] = {
      windowId,
      windowIdentifier,
      isActive: false,
      initialized: true,
      title: "",
      navigation: {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      },
      tabs: {
        [tabId]: createDefaultTabState(tabLevel),
      },
    };
    return;
  }
  if (!windows[windowIdentifier].tabs[tabId]) {
    windows[windowIdentifier].tabs[tabId] = createDefaultTabState(tabLevel);
  }
}

// ---------------------------------------------------------------------------
// Default table state (returned by getters when nothing exists yet)
// ---------------------------------------------------------------------------
export const DEFAULT_TABLE_STATE: TableState = {
  filters: [],
  visibility: {},
  sorting: [],
  order: [],
  isImplicitFilterApplied: undefined,
};

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  activeLevels: [0],
  activeTabsByLevel: new Map(),
  initialized: false,
};

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------
export interface WindowStore {
  /** All open windows, keyed by windowIdentifier */
  windows: WindowContextState;

  // Recovery state — bridged from useGlobalUrlStateRecovery via WindowProvider
  isRecoveryLoading: boolean;
  recoveryError: string | null;
  /** Triggers URL-based recovery to re-run. Set by WindowProvider. */
  triggerRecovery: () => void;

  // ---- Table state setters ------------------------------------------------
  setTableFilters: (windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState, tabLevel?: number) => void;
  setTableVisibility: (windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState, tabLevel?: number) => void;
  setTableSorting: (windowIdentifier: string, tabId: string, sorting: MRT_SortingState, tabLevel?: number) => void;
  setTableOrder: (windowIdentifier: string, tabId: string, order: string[], tabLevel?: number) => void;
  setTableImplicitFilterApplied: (windowIdentifier: string, tabId: string, isApplied: boolean, tabLevel?: number) => void;
  setTableAdvancedCriteria: (windowIdentifier: string, tabId: string, criteria: any, tabLevel?: number) => void;

  // ---- Navigation setters ------------------------------------------------
  setNavigationActiveLevels: (windowIdentifier: string, activeLevels: number[]) => void;
  setNavigationActiveTabsByLevel: (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => void;
  setNavigationInitialized: (windowIdentifier: string, initialized: boolean) => void;

  // ---- Window lifecycle --------------------------------------------------
  setWindowActive: (params: { windowIdentifier: string; windowData?: Partial<WindowState> }) => void;
  setWindowInactive: (windowIdentifier: string) => void;
  setAllWindowsInactive: () => void;
  cleanupWindow: (windowIdentifier: string) => void;
  cleanState: () => void;

  // ---- Form state --------------------------------------------------------
  setTabFormState: (windowIdentifier: string, tabId: string, formState: TabFormState, tabLevel?: number) => void;
  clearTabFormState: (windowIdentifier: string, tabId: string) => void;

  // ---- Selection ---------------------------------------------------------
  setSelectedRecord: (windowIdentifier: string, tabId: string, recordId: string, tabLevel?: number) => void;
  clearSelectedRecord: (windowIdentifier: string, tabId: string) => void;
  clearChildrenSelections: (windowIdentifier: string, childTabIds: string[], isParentSelectionChanging?: boolean) => void;
  setSelectedRecordAndClearChildren: (windowIdentifier: string, tabId: string, recordId: string, childTabIds: string[]) => void;

  // ---- Direct-link init tracking -----------------------------------------
  setTabInitializedWithDirectLink: (windowIdentifier: string, tabId: string, initialized: boolean) => void;

  // ---- Bridge actions (called by WindowProvider) -------------------------
  /** Sync recovery state from useGlobalUrlStateRecovery hook into the store. */
  _setRecovery: (isLoading: boolean, error: string | null, triggerFn: () => void) => void;
  /** Replace windows with recovered state (called once after recovery completes). */
  _initFromRecoveredWindows: (recoveredWindows: WindowState[]) => void;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------
export const useWindowStore = create<WindowStore>()(
  devtools(
    immer((set, get) => ({
      windows: {},
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: () => {},

      // ---- Table state setters ----------------------------------------
      setTableFilters: (windowIdentifier, tabId, filters, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].table.filters = filters;
        }, false, "window/setTableFilters"),

      setTableVisibility: (windowIdentifier, tabId, visibility, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          const current = draft.windows[windowIdentifier].tabs[tabId].table.visibility;
          draft.windows[windowIdentifier].tabs[tabId].table.visibility = { ...current, ...visibility };
        }, false, "window/setTableVisibility"),

      setTableSorting: (windowIdentifier, tabId, sorting, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].table.sorting = sorting;
        }, false, "window/setTableSorting"),

      setTableOrder: (windowIdentifier, tabId, order, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].table.order = order;
        }, false, "window/setTableOrder"),

      setTableImplicitFilterApplied: (windowIdentifier, tabId, isApplied, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].table.isImplicitFilterApplied = isApplied;
        }, false, "window/setTableImplicitFilterApplied"),

      setTableAdvancedCriteria: (windowIdentifier, tabId, criteria, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].table.advancedCriteria = criteria;
        }, false, "window/setTableAdvancedCriteria"),

      // ---- Navigation setters ------------------------------------------
      setNavigationActiveLevels: (windowIdentifier, activeLevels) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]) {
            const windowId = getWindowIdFromIdentifier(windowIdentifier);
            draft.windows[windowIdentifier] = {
              windowId,
              windowIdentifier,
              isActive: false,
              initialized: true,
              title: "",
              navigation: { activeLevels, activeTabsByLevel: new Map(), initialized: false },
              tabs: {},
            };
            return;
          }
          draft.windows[windowIdentifier].navigation.activeLevels = activeLevels;
        }, false, "window/setNavigationActiveLevels"),

      setNavigationActiveTabsByLevel: (windowIdentifier, activeTabsByLevel) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]) {
            const windowId = getWindowIdFromIdentifier(windowIdentifier);
            draft.windows[windowIdentifier] = {
              windowId,
              windowIdentifier,
              isActive: false,
              initialized: true,
              title: "",
              navigation: { activeLevels: [0], activeTabsByLevel, initialized: false },
              tabs: {},
            };
            return;
          }
          draft.windows[windowIdentifier].navigation.activeTabsByLevel = activeTabsByLevel;
        }, false, "window/setNavigationActiveTabsByLevel"),

      setNavigationInitialized: (windowIdentifier, initialized) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]) return;
          draft.windows[windowIdentifier].navigation.initialized = initialized;
        }, false, "window/setNavigationInitialized"),

      // ---- Window lifecycle ------------------------------------------
      setWindowActive: ({ windowIdentifier, windowData }) =>
        set((draft) => {
          // Deactivate all windows
          for (const winId of Object.keys(draft.windows)) {
            if (draft.windows[winId]) {
              draft.windows[winId].isActive = false;
            }
          }

          if (draft.windows[windowIdentifier]) {
            draft.windows[windowIdentifier].isActive = true;
            if (windowData) {
              Object.assign(draft.windows[windowIdentifier], windowData);
            }
          } else {
            const windowId = getWindowIdFromIdentifier(windowIdentifier);
            draft.windows[windowIdentifier] = {
              windowId,
              windowIdentifier,
              isActive: true,
              initialized: windowData?.initialized ?? false,
              title: windowData?.title ?? "",
              navigation: windowData?.navigation ?? {
                activeLevels: [0],
                activeTabsByLevel: new Map(),
                initialized: false,
              },
              tabs: windowData?.tabs ?? {},
            };
          }
        }, false, "window/setWindowActive"),

      setWindowInactive: (windowIdentifier) =>
        set((draft) => {
          if (draft.windows[windowIdentifier]) {
            draft.windows[windowIdentifier].isActive = false;
          }
        }, false, "window/setWindowInactive"),

      setAllWindowsInactive: () =>
        set((draft) => {
          for (const winId of Object.keys(draft.windows)) {
            if (draft.windows[winId]?.isActive) {
              draft.windows[winId].isActive = false;
            }
          }
        }, false, "window/setAllWindowsInactive"),

      cleanupWindow: (windowIdentifier) =>
        set((draft) => {
          const windowToDelete = draft.windows[windowIdentifier];
          if (!windowToDelete) return;

          const wasActive = windowToDelete.isActive;
          const allIds = Object.keys(draft.windows);

          delete draft.windows[windowIdentifier];

          if (wasActive && allIds.length > 1) {
            const deletedIdx = allIds.indexOf(windowIdentifier);
            let toActivate: string | null = null;

            if (deletedIdx > 0) {
              toActivate = allIds[deletedIdx - 1];
            } else if (deletedIdx < allIds.length - 1) {
              toActivate = allIds[deletedIdx + 1];
            }

            if (toActivate && draft.windows[toActivate]) {
              draft.windows[toActivate].isActive = true;
            }
          }
        }, false, "window/cleanupWindow"),

      cleanState: () =>
        set((draft) => {
          draft.windows = {};
        }, false, "window/cleanState"),

      // ---- Form state ------------------------------------------------
      setTabFormState: (windowIdentifier, tabId, formState, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].form = formState;
        }, false, "window/setTabFormState"),

      clearTabFormState: (windowIdentifier, tabId) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]?.tabs[tabId]) return;
          draft.windows[windowIdentifier].tabs[tabId].form = {};
        }, false, "window/clearTabFormState"),

      // ---- Selection -------------------------------------------------
      setSelectedRecord: (windowIdentifier, tabId, recordId, tabLevel = 0) =>
        set((draft) => {
          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId, tabLevel);
          draft.windows[windowIdentifier].tabs[tabId].selectedRecord = recordId;
        }, false, "window/setSelectedRecord"),

      clearSelectedRecord: (windowIdentifier, tabId) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]?.tabs[tabId]) {
            console.warn(`[clearSelectedRecord] Tab ${tabId} not found in window ${windowIdentifier}`);
            return;
          }
          delete draft.windows[windowIdentifier].tabs[tabId].selectedRecord;
        }, false, "window/clearSelectedRecord"),

      clearChildrenSelections: (windowIdentifier, childTabIds, isParentSelectionChanging = false) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]) {
            console.warn(`[clearChildrenSelections] Window ${windowIdentifier} not found in state`);
            return;
          }
          for (const tabId of childTabIds) {
            const tab = draft.windows[windowIdentifier].tabs[tabId];
            if (!tab) continue;

            const isInFormView = tab.form?.mode === TAB_MODES.FORM;
            const shouldClean = !isInFormView || isParentSelectionChanging;

            if (shouldClean) {
              if (tab.selectedRecord !== undefined) {
                delete tab.selectedRecord;
              }
              tab.form = {};
            }
          }
        }, false, "window/clearChildrenSelections"),

      setSelectedRecordAndClearChildren: (windowIdentifier, tabId, recordId, childTabIds) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]) {
            console.warn(`[setSelectedRecordAndClearChildren] Window ${windowIdentifier} not found in state`);
            return;
          }

          const previousRecordId = draft.windows[windowIdentifier].tabs[tabId]?.selectedRecord;
          const isParentSelectionChanging = previousRecordId !== recordId;

          ensureTabExistsDraft(draft.windows, windowIdentifier, tabId);
          draft.windows[windowIdentifier].tabs[tabId].selectedRecord = recordId;

          for (const childTabId of childTabIds) {
            const tab = draft.windows[windowIdentifier].tabs[childTabId];
            if (!tab) continue;

            const isInFormView = tab.form?.mode === TAB_MODES.FORM;
            const shouldClean = !isInFormView || isParentSelectionChanging;

            if (shouldClean) {
              if (tab.selectedRecord !== undefined) {
                delete tab.selectedRecord;
              }
              tab.form = {};
            }
          }
        }, false, "window/setSelectedRecordAndClearChildren"),

      // ---- Direct-link init tracking --------------------------------
      setTabInitializedWithDirectLink: (windowIdentifier, tabId, initialized) =>
        set((draft) => {
          if (!draft.windows[windowIdentifier]?.tabs[tabId]) return;
          draft.windows[windowIdentifier].tabs[tabId].initializedWithDirectLink = initialized;
        }, false, "window/setTabInitializedWithDirectLink"),

      // ---- Bridge actions -------------------------------------------
      _setRecovery: (isLoading, error, triggerFn) =>
        set((draft) => {
          draft.isRecoveryLoading = isLoading;
          draft.recoveryError = error;
          draft.triggerRecovery = triggerFn;
        }, false, "window/_setRecovery"),

      _initFromRecoveredWindows: (recoveredWindows) =>
        set((draft) => {
          const windowsMap: WindowContextState = {};
          for (const win of recoveredWindows) {
            if (draft.windows[win.windowIdentifier]) {
              windowsMap[win.windowIdentifier] = {
                ...draft.windows[win.windowIdentifier],
                isActive: false,
              };
            } else {
              windowsMap[win.windowIdentifier] = win;
            }
          }
          draft.windows = windowsMap;
        }, false, "window/_initFromRecoveredWindows"),
    })),
    { name: "WindowStore" }
  )
);
