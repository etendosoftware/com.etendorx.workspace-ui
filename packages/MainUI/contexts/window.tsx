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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import { type TabFormState, TAB_MODES } from "@/utils/url/constants";
import {
  type WindowState,
  type TableState,
  type NavigationState,
  type WindowContextState,
  WINDOW_PROPERTY_NAMES,
  type WindowPropertyName,
} from "@/utils/window/constants";
import {
  getWindowIdFromIdentifier,
  ensureTabExists,
  updateTableProperty,
  updateNavigationProperty,
} from "@/utils/window/utils";
import { buildWindowsUrlParams } from "@/utils/url/utils";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";

interface WindowContextI {
  // State getters
  getTableState: (windowIdentifier: string, tabId: string) => TableState;
  getNavigationState: (windowIdentifier: string) => NavigationState;
  getActiveWindowIdentifier: () => string | null;
  getActiveWindowProperty: (propertyName: string) => string | boolean | object | null;
  getAllWindowsIdentifiers: () => string[];
  getAllWindows: () => WindowState[];
  getActiveWindow: () => WindowState | null;
  getAllState: () => WindowContextState;

  // Direct access to computed values
  windows: WindowState[];
  activeWindow: WindowState | null;
  isHomeRoute: boolean;

  // State setters
  setTableFilters: (
    windowIdentifier: string,
    tabId: string,
    filters: MRT_ColumnFiltersState,
    tabLevel?: number
  ) => void;
  setTableVisibility: (
    windowIdentifier: string,
    tabId: string,
    visibility: MRT_VisibilityState,
    tabLevel?: number
  ) => void;
  setTableSorting: (windowIdentifier: string, tabId: string, sorting: MRT_SortingState, tabLevel?: number) => void;
  setTableOrder: (windowIdentifier: string, tabId: string, order: string[], tabLevel?: number) => void;
  setTableImplicitFilterApplied: (
    windowIdentifier: string,
    tabId: string,
    isApplied: boolean,
    tabLevel?: number
  ) => void;
  setNavigationActiveLevels: (windowIdentifier: string, activeLevels: number[]) => void;
  setNavigationActiveTabsByLevel: (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => void;
  setWindowActive: ({
    windowIdentifier,
    windowData,
  }: { windowIdentifier: string; windowData?: Partial<WindowState> }) => void;
  setWindowInactive: (windowIdentifier: string) => void;
  setAllWindowsInactive: () => void;

  // Form state management
  getTabFormState: (windowIdentifier: string, tabId: string) => TabFormState | undefined;
  setTabFormState: (windowIdentifier: string, tabId: string, formState: TabFormState, tabLevel?: number) => void;
  clearTabFormState: (windowIdentifier: string, tabId: string) => void;

  // Selected record management
  getSelectedRecord: (windowIdentifier: string, tabId: string) => string | undefined;
  setSelectedRecord: (windowIdentifier: string, tabId: string, recordId: string, tabLevel?: number) => void;
  clearSelectedRecord: (windowIdentifier: string, tabId: string) => void;
  clearChildrenSelections: (
    windowIdentifier: string,
    childTabIds: string[],
    isParentSelectionChanging?: boolean
  ) => void;
  setSelectedRecordAndClearChildren: (
    windowIdentifier: string,
    tabId: string,
    recordId: string,
    childTabIds: string[]
  ) => void;

  // Navigation initialization management
  getNavigationInitialized: (windowIdentifier: string) => boolean;
  setNavigationInitialized: (windowIdentifier: string, initialized: boolean) => void;

  // Recovery state management
  /** Loading indicator for URL-driven window recovery (true during recovery process) */
  isRecoveryLoading: boolean;
  /** Error message if recovery fails, null otherwise */
  recoveryError: string | null;
  /**
   * Triggers the URL recovery system to re-execute.
   * Resets the internal guard flag, allowing recovery to run again when URL changes.
   *
   * Primary use case: Opening new windows from linked items.
   * Call this before updating the URL with new window parameters.
   */
  triggerRecovery: () => void;

  // Window management
  cleanupWindow: (windowIdentifier: string) => void;
  cleanState: () => void;
}

// Context creation
const WindowContext = createContext<WindowContextI | undefined>(undefined);

// Provider component
export default function WindowProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<WindowContextState>({});

  const { recoveredWindows, isRecoveryLoading, recoveryError, triggerRecovery } = useGlobalUrlStateRecovery();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Getters
  const getTableState = useCallback(
    (windowIdentifier: string, tabId: string): TableState => {
      const defaultTableState: TableState = {
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
        isImplicitFilterApplied: undefined,
      };

      if (!state[windowIdentifier] || !state[windowIdentifier].tabs[tabId]) {
        return defaultTableState;
      }

      return state[windowIdentifier].tabs[tabId].table || defaultTableState;
    },
    [state]
  );

  const getNavigationState = useCallback(
    (windowIdentifier: string): NavigationState => {
      const defaultNavigationState: NavigationState = {
        activeLevels: [0],
        activeTabsByLevel: new Map(),
        initialized: false,
      };

      if (!state[windowIdentifier]) {
        return defaultNavigationState;
      }

      return state[windowIdentifier].navigation || defaultNavigationState;
    },
    [state]
  );

  const getActiveWindowIdentifier = useCallback((): string | null => {
    const allWindows = Object.entries(state);
    for (const [windowIdentifier, windowState] of allWindows) {
      if (windowState.isActive) {
        return windowIdentifier;
      }
    }
    return null;
  }, [state]);

  const getActiveWindowProperty = useCallback(
    (propertyName: string): string | boolean | object | null => {
      // Validate that propertyName is not empty
      if (!propertyName || propertyName.trim() === "") {
        return null;
      }

      // Validate that propertyName is valid
      const validProperties = Object.values(WINDOW_PROPERTY_NAMES);
      if (!validProperties.includes(propertyName as WindowPropertyName)) {
        return null;
      }

      // Get the active window identifier
      const activeWindowIdentifier = getActiveWindowIdentifier();
      if (!activeWindowIdentifier) {
        return null;
      }

      const activeWindow = state[activeWindowIdentifier];
      if (!activeWindow) {
        return null;
      }

      // Return the requested property
      switch (propertyName) {
        case WINDOW_PROPERTY_NAMES.TITLE:
          return activeWindow.title;
        case WINDOW_PROPERTY_NAMES.IS_ACTIVE:
          return activeWindow.isActive;
        case WINDOW_PROPERTY_NAMES.WINDOW_IDENTIFIER:
          return activeWindowIdentifier;
        case WINDOW_PROPERTY_NAMES.TABS:
          return activeWindow.tabs;
        default:
          return null;
      }
    },
    [state, getActiveWindowIdentifier]
  );

  const getAllWindowsIdentifiers = useCallback((): string[] => {
    return Object.keys(state);
  }, [state]);

  const getAllState = useCallback((): WindowContextState => {
    return state;
  }, [state]);

  const getAllWindows = useCallback((): WindowState[] => {
    return Object.values(state);
  }, [state]);

  const getActiveWindow = useCallback((): WindowState | null => {
    const activeWindowIdentifier = getActiveWindowIdentifier();
    return activeWindowIdentifier ? state[activeWindowIdentifier] : null;
  }, [state, getActiveWindowIdentifier]);

  // Setters
  const setTableFilters = useCallback(
    (windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState, tabLevel = 0) => {
      setState((prevState: WindowContextState) =>
        updateTableProperty(prevState, windowIdentifier, tabId, "filters", filters, tabLevel)
      );
    },
    []
  );

  const setTableVisibility = useCallback(
    (windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState, tabLevel = 0) => {
      setState((prevState: WindowContextState) => {
        const tempState = ensureTabExists(prevState, windowIdentifier, tabId, tabLevel);
        const currentVisibility = tempState[windowIdentifier].tabs[tabId].table.visibility;

        // Create deep copy with proper immutability at all levels
        return {
          ...tempState,
          [windowIdentifier]: {
            ...tempState[windowIdentifier],
            tabs: {
              ...tempState[windowIdentifier].tabs,
              [tabId]: {
                ...tempState[windowIdentifier].tabs[tabId],
                table: {
                  ...tempState[windowIdentifier].tabs[tabId].table,
                  visibility: { ...currentVisibility, ...visibility },
                },
              },
            },
          },
        };
      });
    },
    []
  );

  const setTableSorting = useCallback(
    (windowIdentifier: string, tabId: string, sorting: MRT_SortingState, tabLevel = 0) => {
      setState((prevState: WindowContextState) =>
        updateTableProperty(prevState, windowIdentifier, tabId, "sorting", sorting, tabLevel)
      );
    },
    []
  );

  const setTableOrder = useCallback((windowIdentifier: string, tabId: string, order: string[], tabLevel = 0) => {
    setState((prevState: WindowContextState) =>
      updateTableProperty(prevState, windowIdentifier, tabId, "order", order, tabLevel)
    );
  }, []);

  const setTableImplicitFilterApplied = useCallback(
    (windowIdentifier: string, tabId: string, isApplied: boolean, tabLevel = 0) => {
      setState((prevState: WindowContextState) =>
        updateTableProperty(prevState, windowIdentifier, tabId, "isImplicitFilterApplied", isApplied, tabLevel)
      );
    },
    []
  );

  const setNavigationActiveLevels = useCallback((windowIdentifier: string, activeLevels: number[]) => {
    setState((prevState: WindowContextState) =>
      updateNavigationProperty(prevState, windowIdentifier, "activeLevels", activeLevels)
    );
  }, []);

  const setNavigationActiveTabsByLevel = useCallback(
    (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => {
      setState((prevState: WindowContextState) =>
        updateNavigationProperty(prevState, windowIdentifier, "activeTabsByLevel", activeTabsByLevel)
      );
    },
    []
  );

  const setWindowActive = useCallback(
    ({ windowIdentifier, windowData }: { windowIdentifier: string; windowData?: Partial<WindowState> }) => {
      setState((prevState: WindowContextState) => {
        const newState = { ...prevState };

        // Deactivate all windows
        for (const winId of Object.keys(newState)) {
          if (newState[winId]) {
            newState[winId] = { ...newState[winId], isActive: false };
          }
        }

        // Activate the specified window
        if (newState[windowIdentifier]) {
          newState[windowIdentifier] = { ...newState[windowIdentifier], isActive: true, ...windowData };
        } else {
          const windowId = getWindowIdFromIdentifier(windowIdentifier);
          // Create window if it doesn't exist
          newState[windowIdentifier] = {
            windowId,
            windowIdentifier,
            isActive: true,
            initialized: windowData?.initialized ?? false,
            title: windowData?.title || "",
            navigation: windowData?.navigation || {
              activeLevels: [0],
              activeTabsByLevel: new Map(),
              initialized: false,
            },
            tabs: windowData?.tabs || {},
          };
        }

        return newState;
      });
    },
    []
  );

  const setWindowInactive = useCallback((windowIdentifier: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (newState[windowIdentifier]) {
        newState[windowIdentifier] = { ...newState[windowIdentifier], isActive: false };
      }

      return newState;
    });
  }, []);

  const setAllWindowsInactive = useCallback(() => {
    setState((prevState: WindowContextState) => {
      return Object.fromEntries(
        Object.entries(prevState).map(([winId, window]) => [
          winId,
          window?.isActive ? { ...window, isActive: false } : window,
        ])
      );
    });
  }, []);

  const getTabFormState = useCallback(
    (windowIdentifier: string, tabId: string): TabFormState | undefined => {
      if (!state[windowIdentifier] || !state[windowIdentifier].tabs[tabId]) {
        return undefined;
      }
      return state[windowIdentifier].tabs[tabId].form;
    },
    [state]
  );

  const setTabFormState = useCallback(
    (windowIdentifier: string, tabId: string, formState: TabFormState, tabLevel = 0) => {
      setState((prevState: WindowContextState) => {
        const tempState = ensureTabExists(prevState, windowIdentifier, tabId, tabLevel);

        // Create deep copy with proper immutability at all levels
        return {
          ...tempState,
          [windowIdentifier]: {
            ...tempState[windowIdentifier],
            tabs: {
              ...tempState[windowIdentifier].tabs,
              [tabId]: {
                ...tempState[windowIdentifier].tabs[tabId],
                form: formState,
              },
            },
          },
        };
      });
    },
    []
  );

  const clearTabFormState = useCallback((windowIdentifier: string, tabId: string) => {
    setState((prevState: WindowContextState) => {
      // Validate window and tab exist
      if (!prevState[windowIdentifier]?.tabs[tabId]) {
        return prevState;
      }

      // Create deep copy with proper immutability at all levels
      return {
        ...prevState,
        [windowIdentifier]: {
          ...prevState[windowIdentifier],
          tabs: {
            ...prevState[windowIdentifier].tabs,
            [tabId]: {
              ...prevState[windowIdentifier].tabs[tabId],
              form: {},
            },
          },
        },
      };
    });
  }, []);

  const getSelectedRecord = useCallback(
    (windowIdentifier: string, tabId: string): string | undefined => {
      if (!state[windowIdentifier] || !state[windowIdentifier].tabs[tabId]) {
        return undefined;
      }
      return state[windowIdentifier].tabs[tabId].selectedRecord;
    },
    [state]
  );

  const setSelectedRecord = useCallback((windowIdentifier: string, tabId: string, recordId: string, tabLevel = 0) => {
    setState((prevState: WindowContextState) => {
      const newState = ensureTabExists(prevState, windowIdentifier, tabId, tabLevel);

      // Create deep copy with proper immutability at all levels
      return {
        ...newState,
        [windowIdentifier]: {
          ...newState[windowIdentifier],
          tabs: {
            ...newState[windowIdentifier].tabs,
            [tabId]: {
              ...newState[windowIdentifier].tabs[tabId],
              selectedRecord: recordId,
            },
          },
        },
      };
    });
  }, []);

  const clearSelectedRecord = useCallback((windowIdentifier: string, tabId: string) => {
    setState((prevState: WindowContextState) => {
      // Validate window and tab exist
      if (!prevState[windowIdentifier]?.tabs[tabId]) {
        console.warn(`[clearSelectedRecord] Tab ${tabId} not found in window ${windowIdentifier}`);
        return prevState;
      }

      // Use destructuring to REMOVE the selectedRecord property entirely
      const { selectedRecord: _removed, ...tabWithoutSelectedRecord } = prevState[windowIdentifier].tabs[tabId];

      // Create deep copy with proper immutability at all levels
      const newState = {
        ...prevState,
        [windowIdentifier]: {
          ...prevState[windowIdentifier],
          tabs: {
            ...prevState[windowIdentifier].tabs,
            [tabId]: tabWithoutSelectedRecord,
          },
        },
      };

      return newState;
    });
  }, []);

  const clearChildrenSelections = useCallback(
    (windowIdentifier: string, childTabIds: string[], isParentSelectionChanging = false) => {
      // Check if the window exists in the state
      if (!state[windowIdentifier]) {
        console.warn(`[clearChildrenSelections] Window ${windowIdentifier} not found in state`);
        return;
      }

      const childrenCleaned: string[] = [];

      for (const tabId of childTabIds) {
        // Check if this child should be preserved
        const childState = getTabFormState(windowIdentifier, tabId);
        const isInFormView = childState?.mode === TAB_MODES.FORM;

        // Only clean if not in FormView OR if parent selection is changing (forced clean)
        const shouldClean = !isInFormView || isParentSelectionChanging;

        if (shouldClean) {
          // Check if tab has selected record before clearing
          const selectedRecord = getSelectedRecord(windowIdentifier, tabId);
          if (selectedRecord) {
            clearSelectedRecord(windowIdentifier, tabId);
            childrenCleaned.push(tabId);
          }
          // Clear form state only for children that should be cleaned
          clearTabFormState(windowIdentifier, tabId);
        } else {
          console.log(`[clearChildrenSelections] Preserving child ${tabId} - currently in FormView`, childState);
        }
      }

      console.log(
        `[clearChildrenSelections] Cleared children: [${childrenCleaned.join(", ")}] from window ${windowIdentifier}`
      );
    },
    [state, getTabFormState, getSelectedRecord, clearSelectedRecord, clearTabFormState]
  );

  const setSelectedRecordAndClearChildren = useCallback(
    (windowIdentifier: string, tabId: string, recordId: string, childTabIds: string[]) => {
      // Check if the window exists in the state
      if (!state[windowIdentifier]) {
        console.warn(`[setSelectedRecordAndClearChildren] Window ${windowIdentifier} not found in state`);
        return;
      }

      const previousRecordId = getSelectedRecord(windowIdentifier, tabId);
      const isParentSelectionChanging = previousRecordId !== recordId;

      // Set the selected record using context
      setSelectedRecord(windowIdentifier, tabId, recordId);
      clearChildrenSelections(windowIdentifier, childTabIds, isParentSelectionChanging);
    },
    [state, getSelectedRecord, setSelectedRecord, clearChildrenSelections]
  );

  const cleanupWindow = useCallback((windowIdentifier: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      // Check if the window being deleted is the active one
      const windowToDelete: WindowState = newState[windowIdentifier];
      const wasActive = windowToDelete.isActive;

      // Get all window identifiers in order (implicit order from state)
      const allWindowIdentifiers = Object.keys(newState);

      // Delete the window
      delete newState[windowIdentifier];

      // If the deleted window was active and there are remaining windows, activate another one
      if (wasActive && allWindowIdentifiers.length > 1) {
        const deletedWindowIndex = allWindowIdentifiers.indexOf(windowIdentifier);
        let windowToActivate: string | null = null;

        // Try to activate the previous window first
        if (deletedWindowIndex > 0) {
          windowToActivate = allWindowIdentifiers[deletedWindowIndex - 1];
        }
        // If no previous window, activate the next one
        else if (deletedWindowIndex < allWindowIdentifiers.length - 1) {
          windowToActivate = allWindowIdentifiers[deletedWindowIndex + 1];
        }

        // Activate the selected window
        if (windowToActivate && newState[windowToActivate]) {
          newState[windowToActivate] = {
            ...newState[windowToActivate],
            isActive: true,
          };
        }
      }

      return newState;
    });
  }, []);

  const getNavigationInitialized = useCallback(
    (windowIdentifier: string): boolean => {
      if (!state[windowIdentifier]) {
        return false;
      }
      return state[windowIdentifier].navigation?.initialized || false;
    },
    [state]
  );

  const setNavigationInitialized = useCallback((windowIdentifier: string, initialized: boolean) => {
    setState((prevState: WindowContextState) =>
      updateNavigationProperty(prevState, windowIdentifier, "initialized", initialized)
    );
  }, []);

  const cleanState = useCallback(() => {
    setState({});
  }, []);

  // Computed values using existing helper functions
  const windows = useMemo((): WindowState[] => {
    return getAllWindows();
  }, [getAllWindows]);

  const activeWindow = useMemo((): WindowState | null => {
    return getActiveWindow();
  }, [getActiveWindow]);

  const isHomeRoute = useMemo((): boolean => {
    return !activeWindow;
  }, [activeWindow]);

  /**
   * Initialize state from recovered windows
   *
   * Purpose: Populates the WindowContext state with the fully recovered window objects
   * once the global recovery process is complete. This replaces the previous "ghost window"
   * mechanism with a full state initialization.
   *
   * Execution: Runs when `isRecoveryLoading` becomes false and `recoveredWindows` are available.
   *
   * Flow:
   * 1. Waits for global recovery to finish (!isRecoveryLoading)
   * 2. Checks if any windows were recovered
   * 3. Transforms the array of recovered windows into the WindowContextState map format
   * 4. Updates the provider state, effectively "mounting" all windows at once
   */
  useEffect(() => {
    if (!isRecoveryLoading && recoveredWindows.length > 0) {
      const windowsMap = recoveredWindows.reduce((acc, win) => {
        acc[win.windowIdentifier] = win;
        return acc;
      }, {} as WindowContextState);

      setState(windowsMap);
    }
  }, [isRecoveryLoading, recoveredWindows]);

  /**
   * Synchronize window state to URL
   *
   * Purpose: Maintains bidirectional synchronization between the window context state and the browser URL.
   * This effect ensures that any changes to window state (navigation, selections, filters, etc.) are
   * reflected in the URL, enabling:
   * - Browser back/forward navigation
   * - Page refresh recovery
   * - Shareable URLs with specific window states
   *
   * Execution: Runs throughout the component lifecycle whenever window state changes.
   *
   * Critical Guards:
   * 1. !isAnyWindowRecoveringValue: Prevents URL updates during the recovery process.
   *    During recovery, the URL is the source of truth and should not be modified until recovery completes.
   *    This prevents race conditions and circular updates between URL → State → URL.
   *
   * 2. areAllWindowsInitializedValue: Ensures all phantom windows have been fully initialized with
   *    their complete metadata before syncing to URL. This prevents partial/incomplete state from
   *    being persisted to the URL.
   *
   * 3. windows.length === 0: Prevents unnecessary URL updates when no windows exist.
   *
   * 4. newParams !== currentParams: Avoids redundant navigation calls when URL already reflects current state.
   *
   * Flow:
   * 1. Validates that recovery is complete and windows are initialized
   * 2. Builds new URL parameters from current window state
   * 3. Compares with current URL parameters
   * 4. Updates URL via router.replace if parameters have changed
   */
  useEffect(() => {
    // Only update URL if not recovering and all windows are initialized
    if (isRecoveryLoading) {
      return;
    }

    if (windows.length === 0) {
      return;
    }

    const newParams = buildWindowsUrlParams(windows);
    const currentParams = searchParams?.toString() || "";

    // Only update if params have changed to avoid unnecessary navigation
    if (newParams !== currentParams) {
      const newUrl = newParams ? `window?${newParams}` : "window";
      router.replace(newUrl);
    }
  }, [windows, router, searchParams, isRecoveryLoading]);

  const value = useMemo(
    () => ({
      windows,
      activeWindow,
      isHomeRoute,

      getTableState,
      getNavigationState,
      getActiveWindowIdentifier,
      getActiveWindowProperty,
      getAllWindowsIdentifiers,
      getAllWindows,
      getActiveWindow,
      getAllState,

      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
      setWindowActive,
      setWindowInactive,
      setAllWindowsInactive,
      getTabFormState,
      setTabFormState,
      clearTabFormState,

      getSelectedRecord,
      setSelectedRecord,
      clearSelectedRecord,
      clearChildrenSelections,
      setSelectedRecordAndClearChildren,

      isRecoveryLoading,
      recoveryError,
      triggerRecovery,

      getNavigationInitialized,
      setNavigationInitialized,

      cleanupWindow,
      cleanState,
    }),
    [
      windows,
      activeWindow,
      isHomeRoute,

      getTableState,
      getNavigationState,
      getActiveWindowIdentifier,
      getActiveWindowProperty,
      getAllWindowsIdentifiers,
      getAllWindows,
      getActiveWindow,
      getAllState,

      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
      setWindowActive,
      setWindowInactive,
      setAllWindowsInactive,
      getTabFormState,
      setTabFormState,
      clearTabFormState,

      getSelectedRecord,
      setSelectedRecord,
      clearSelectedRecord,
      clearChildrenSelections,
      setSelectedRecordAndClearChildren,

      isRecoveryLoading,
      recoveryError,
      triggerRecovery,

      getNavigationInitialized,
      setNavigationInitialized,

      cleanupWindow,
      cleanState,
    ]
  );

  return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;
}

export const useWindowContext = () => {
  const context = useContext(WindowContext);

  if (!context) {
    throw new Error("useWindowContext must be used within a WindowProvider");
  }

  return context;
};
