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

// Type Definitions
interface TableState {
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
  isImplicitFilterApplied: boolean | undefined;
}
interface NavigationState {
  activeLevels: number[];
  activeTabsByLevel: Map<number, string>;
}

interface TabState {
  table: TableState;
  navigation: NavigationState;
}

interface WindowState {
  isActive: boolean;
  tabs: {
    [tabId: string]: TabState;
  };
}

interface WindowContextState {
  [windowIdentifier: string]: WindowState;
}

interface WindowContextI {
  // State getters
  getTableState: (windowIdentifier: string, tabId: string) => TableState;
  getNavigationState: (windowIdentifier: string) => NavigationState;
  getActiveWindowIdentifier: () => string | null;
  getAllWindowsIdentifiers: () => string[];

  // State setters
  setTableFilters: (windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState) => void;
  setTableVisibility: (windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState) => void;
  setTableSorting: (windowIdentifier: string, tabId: string, sorting: MRT_SortingState) => void;
  setTableOrder: (windowIdentifier: string, tabId: string, order: string[]) => void;
  setTableImplicitFilterApplied: (windowIdentifier: string, tabId: string, isApplied: boolean) => void;
  setNavigationActiveLevels: (windowIdentifier: string, activeLevels: number[]) => void;
  setNavigationActiveTabsByLevel: (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => void;
  setWindowActive: (windowIdentifier: string) => void;
  setWindowInactive: (windowIdentifier: string) => void;

  // Window management
  cleanupWindow: (windowIdentifier: string) => void;

  // Debug/utility
  getAllState: () => WindowContextState;
}

// Context creation
const WindowContext = createContext<WindowContextI | undefined>(undefined);

// Helper functions to reduce code duplication
const createDefaultTabState = (): TabState => ({
  table: {
    filters: [],
    visibility: {},
    sorting: [],
    order: [],
    isImplicitFilterApplied: false,
  },
  navigation: {
    activeLevels: [0],
    activeTabsByLevel: new Map(),
  },
});

const ensureTabExists = (state: WindowContextState, windowIdentifier: string, tabId: string): WindowContextState => {
  const newState = { ...state };

  if (!newState[windowIdentifier]) {
    newState[windowIdentifier] = {
      isActive: false,
      tabs: {},
    };
  }

  if (!newState[windowIdentifier].tabs[tabId]) {
    newState[windowIdentifier].tabs[tabId] = createDefaultTabState();
  }

  return newState;
};

const updateTableProperty = <T extends keyof TableState>(
  prevState: WindowContextState,
  windowIdentifier: string,
  tabId: string,
  property: T,
  value: TableState[T]
): WindowContextState => {
  const newState = ensureTabExists(prevState, windowIdentifier, tabId);
  newState[windowIdentifier].tabs[tabId].table[property] = value;
  return newState;
};

const updateNavigationProperty = <T extends keyof NavigationState>(
  prevState: WindowContextState,
  windowIdentifier: string,
  property: T,
  value: NavigationState[T]
): WindowContextState => {
  const newState = { ...prevState };

  if (!newState[windowIdentifier]) {
    newState[windowIdentifier] = {
      isActive: false,
      tabs: {},
    };
  }

  const tabIds = Object.keys(newState[windowIdentifier].tabs);
  const isTabIdsEmpty = tabIds.length === 0;

  if (isTabIdsEmpty) {
    const defaultTabId = "default";
    newState[windowIdentifier].tabs[defaultTabId] = createDefaultTabState();
    newState[windowIdentifier].tabs[defaultTabId].navigation[property] = value;
    return newState;
  }

  const currentTabId = tabIds[0];
  if (!newState[windowIdentifier].tabs[currentTabId]) {
    newState[windowIdentifier].tabs[currentTabId] = createDefaultTabState();
  }

  newState[windowIdentifier].tabs[currentTabId].navigation[property] = value;
  return newState;
};

// Provider component
export default function WindowProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<WindowContextState>({});

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
      };

      if (!state[windowIdentifier]) {
        return defaultNavigationState;
      }

      const tabIds = Object.keys(state[windowIdentifier].tabs);
      if (tabIds.length === 0) {
        return defaultNavigationState;
      }

      const currentTabId = tabIds[0];
      return state[windowIdentifier].tabs[currentTabId].navigation || defaultNavigationState;
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

  const getAllWindowsIdentifiers = useCallback((): string[] => {
    return Object.keys(state);
  }, [state]);

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
  const setWindowActive = useCallback((windowIdentifier: string) => {
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
        newState[windowIdentifier] = { ...newState[windowIdentifier], isActive: true };
      } else {
        // Create window if it doesn't exist
        newState[windowIdentifier] = {
          isActive: true,
          tabs: {},
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

  const cleanupWindow = useCallback((windowIdentifier: string) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };
      delete newState[windowIdentifier];
      return newState;
    });
  }, []);

  const getAllState = useCallback(() => {
    return state;
  }, [state]);

  const value = useMemo(
    () => ({
      getTableState,
      getNavigationState,
      getActiveWindowIdentifier,
      getAllWindowsIdentifiers,
      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
      setWindowActive,
      setWindowInactive,
      cleanupWindow,
      getAllState,
    }),
    [
      getTableState,
      getNavigationState,
      getActiveWindowIdentifier,
      getAllWindowsIdentifiers,
      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
      setWindowActive,
      setWindowInactive,
      cleanupWindow,
      getAllState,
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
