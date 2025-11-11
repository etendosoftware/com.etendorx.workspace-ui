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

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import type { TabFormState } from "@/utils/url/constants";
import {
  WindowState,
  TableState,
  NavigationState,
  WindowContextState,
  WINDOW_PROPERTY_NAMES,
  WindowPropertyName
} from "@/utils/window/constants";
import { getWindowIdFromIdentifier, ensureTabExists, updateTableProperty, updateNavigationProperty } from '@/utils/window/utils';

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
  setTableFilters: (windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState) => void;
  setTableVisibility: (windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState) => void;
  setTableSorting: (windowIdentifier: string, tabId: string, sorting: MRT_SortingState) => void;
  setTableOrder: (windowIdentifier: string, tabId: string, order: string[]) => void;
  setTableImplicitFilterApplied: (windowIdentifier: string, tabId: string, isApplied: boolean) => void;
  setNavigationActiveLevels: (windowIdentifier: string, activeLevels: number[]) => void;
  setNavigationActiveTabsByLevel: (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => void;
  setWindowActive: ({ windowIdentifier, windowData }: { windowIdentifier: string, windowData?: Partial<WindowState> }) => void;
  setWindowInactive: (windowIdentifier: string) => void;

  // Form state management
  getTabFormState: (windowIdentifier: string, tabId: string) => TabFormState | undefined;
  setTabFormState: (windowIdentifier: string, tabId: string, formState: TabFormState) => void;
  clearTabFormState: (windowIdentifier: string, tabId: string) => void;

  // Selected record management
  getSelectedRecord: (windowIdentifier: string, tabId: string) => string | undefined;
  setSelectedRecord: (windowIdentifier: string, tabId: string, recordId: string) => void;
  clearSelectedRecord: (windowIdentifier: string, tabId: string) => void;

  // Navigation initialization management
  getNavigationInitialized: (windowIdentifier: string) => boolean;
  setNavigationInitialized: (windowIdentifier: string, initialized: boolean) => void;

  // Window management
  cleanupWindow: (windowIdentifier: string) => void;
}

// Context creation
const WindowContext = createContext<WindowContextI | undefined>(undefined);

// Provider component
export default function WindowProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<WindowContextState>({});

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

  const getActiveWindowProperty = useCallback((propertyName: string): string | boolean | object | null => {
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
  }, [state, getActiveWindowIdentifier]);

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
  const setTableFilters = useCallback((windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState) => {
    setState((prevState: WindowContextState) =>
      updateTableProperty(prevState, windowIdentifier, tabId, "filters", filters)
    );
  }, []);

  const setTableVisibility = useCallback((windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState) => {
    setState((prevState: WindowContextState) => {
      const newState = ensureTabExists(prevState, windowIdentifier, tabId);
      const currentVisibility = newState[windowIdentifier].tabs[tabId].table.visibility;
      newState[windowIdentifier].tabs[tabId].table.visibility = { ...currentVisibility, ...visibility };
      return newState;
    });
  }, []);

  const setTableSorting = useCallback((windowIdentifier: string, tabId: string, sorting: MRT_SortingState) => {
    setState((prevState: WindowContextState) =>
      updateTableProperty(prevState, windowIdentifier, tabId, "sorting", sorting)
    );
  }, []);

  const setTableOrder = useCallback((windowIdentifier: string, tabId: string, order: string[]) => {
    setState((prevState: WindowContextState) =>
      updateTableProperty(prevState, windowIdentifier, tabId, "order", order)
    );
  }, []);

  const setTableImplicitFilterApplied = useCallback((windowIdentifier: string, tabId: string, isApplied: boolean) => {
    setState((prevState: WindowContextState) =>
      updateTableProperty(prevState, windowIdentifier, tabId, "isImplicitFilterApplied", isApplied)
    );
  }, []);

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

  // NOTE: on the transtiton to active a new window, the activeWindow is null then show a empty window
  // TODO: show a loading state instead of an empty window
  const setWindowActive = useCallback(({ windowIdentifier, windowData }: { windowIdentifier: string, windowData?: Partial<WindowState> }) => {
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
  }, []);

  const setWindowInactive = useCallback((windowIdentifier: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (newState[windowIdentifier]) {
        newState[windowIdentifier] = { ...newState[windowIdentifier], isActive: false };
      }

      return newState;
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

  const setTabFormState = useCallback((windowIdentifier: string, tabId: string, formState: TabFormState) => {
    setState((prevState: WindowContextState) => {
      const newState = ensureTabExists(prevState, windowIdentifier, tabId);
      newState[windowIdentifier].tabs[tabId].form = formState;
      return newState;
    });
  }, []);

  const clearTabFormState = useCallback((windowIdentifier: string, tabId: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };
      if (newState[windowIdentifier] && newState[windowIdentifier].tabs[tabId]) {
        newState[windowIdentifier].tabs[tabId] = {
          ...newState[windowIdentifier].tabs[tabId],
          form: {},
        };
      }
      return newState;
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

  const setSelectedRecord = useCallback((windowIdentifier: string, tabId: string, recordId: string) => {
    setState((prevState: WindowContextState) => {
      const newState = ensureTabExists(prevState, windowIdentifier, tabId);
      newState[windowIdentifier].tabs[tabId].selectedRecord = recordId;
      return newState;
    });
  }, []);

  const clearSelectedRecord = useCallback((windowIdentifier: string, tabId: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };
      if (newState[windowIdentifier] && newState[windowIdentifier].tabs[tabId]) {
        newState[windowIdentifier].tabs[tabId] = {
          ...newState[windowIdentifier].tabs[tabId],
          selectedRecord: undefined,
        };
      }
      return newState;
    });
  }, []);

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
            isActive: true
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
      getTabFormState,
      setTabFormState,
      clearTabFormState,

      getSelectedRecord,
      setSelectedRecord,
      clearSelectedRecord,

      getNavigationInitialized,
      setNavigationInitialized,

      cleanupWindow,
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
      getTabFormState,
      setTabFormState,
      clearTabFormState,
      getSelectedRecord,
      setSelectedRecord,
      clearSelectedRecord,
      getNavigationInitialized,
      setNavigationInitialized,
      cleanupWindow,
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
