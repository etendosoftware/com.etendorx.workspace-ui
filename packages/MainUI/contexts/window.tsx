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
  [tabId: string]: TabState;
}

interface WindowContextState {
  [windowIdentifier: string]: WindowState;
}

interface WindowContextI {
  // State getters
  getTableState: (windowIdentifier: string, tabId: string) => TableState;
  getNavigationState: (windowIdentifier: string) => NavigationState;

  // State setters
  setTableFilters: (windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState) => void;
  setTableVisibility: (windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState) => void;
  setTableSorting: (windowIdentifier: string, tabId: string, sorting: MRT_SortingState) => void;
  setTableOrder: (windowIdentifier: string, tabId: string, order: string[]) => void;
  setTableImplicitFilterApplied: (windowIdentifier: string, tabId: string, isApplied: boolean) => void;
  setNavigationActiveLevels: (windowIdentifier: string, activeLevels: number[]) => void;
  setNavigationActiveTabsByLevel: (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => void;

  // Window management
  cleanupWindow: (windowIdentifier: string) => void;

  // Debug/utility
  getAllState: () => WindowContextState;
}

// Context creation
const WindowContext = createContext<WindowContextI | undefined>(undefined);

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

      if (!state[windowIdentifier] || !state[windowIdentifier][tabId]) {
        return defaultTableState;
      }

      return state[windowIdentifier][tabId].table || defaultTableState;
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

      const tabsId = Object.keys(state[windowIdentifier]);
      const isTabIdsEmpty = tabsId.length === 0;

      if (isTabIdsEmpty) {
        return defaultNavigationState;
      }

      const currentTabId = tabsId[0];
      return state[windowIdentifier][currentTabId].navigation;
    },
    [state]
  );

  const setTableFilters = useCallback((windowIdentifier: string, tabId: string, filters: MRT_ColumnFiltersState) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      if (!newState[windowIdentifier][tabId]) {
        newState[windowIdentifier][tabId] = {
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
        };
      }

      newState[windowIdentifier][tabId].table.filters = filters;
      return newState;
    });
  }, []);

  const setTableVisibility = useCallback((windowIdentifier: string, tabId: string, visibility: MRT_VisibilityState) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      if (!newState[windowIdentifier][tabId]) {
        newState[windowIdentifier][tabId] = {
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
        };
      }
      const currentVisibility = newState[windowIdentifier][tabId].table.visibility;
      newState[windowIdentifier][tabId].table.visibility = { ...currentVisibility, ...visibility };
      return newState;
    });
  }, []);

  const setTableSorting = useCallback((windowIdentifier: string, tabId: string, sorting: MRT_SortingState) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      if (!newState[windowIdentifier][tabId]) {
        newState[windowIdentifier][tabId] = {
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
        };
      }

      newState[windowIdentifier][tabId].table.sorting = sorting;
      return newState;
    });
  }, []);

  const setTableOrder = useCallback((windowIdentifier: string, tabId: string, order: string[]) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      if (!newState[windowIdentifier][tabId]) {
        newState[windowIdentifier][tabId] = {
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
        };
      }

      newState[windowIdentifier][tabId].table.order = order;
      return newState;
    });
  }, []);

  const setTableImplicitFilterApplied = useCallback((windowIdentifier: string, tabId: string, isApplied: boolean) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      if (!newState[windowIdentifier][tabId]) {
        newState[windowIdentifier][tabId] = {
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
        };
      }

      newState[windowIdentifier][tabId].table.isImplicitFilterApplied = isApplied;
      return newState;
    });
  }, []);

  const setNavigationActiveLevels = useCallback((windowIdentifier: string, activeLevels: number[]) => {
    setState((prevState: WindowContextState) => {
      const newState = { ...prevState };

      if (!newState[windowIdentifier]) {
        newState[windowIdentifier] = {};
      }

      // Update navigation state for all tabs in the window
      const tabIds = Object.keys(newState[windowIdentifier]);
      const isTabIdsEmpty = tabIds.length === 0;

      if (isTabIdsEmpty) {
        newState[windowIdentifier] = {};
      }

      const currentTabId = tabIds[0];
      newState[windowIdentifier][currentTabId].navigation.activeLevels = activeLevels;

      return newState;
    });
  }, []);

  const setNavigationActiveTabsByLevel = useCallback(
    (windowIdentifier: string, activeTabsByLevel: Map<number, string>) => {
      setState((prevState: WindowContextState) => {
        const newState = { ...prevState };

        if (!newState[windowIdentifier]) {
          newState[windowIdentifier] = {};
        }

        // Update navigation state for all tabs in the window
        const tabIds = Object.keys(newState[windowIdentifier]);
        const isTabIdsEmpty = tabIds.length === 0;

        if (isTabIdsEmpty) {
          newState[windowIdentifier] = {};
        }

        const currentTabId = tabIds[0];
        newState[windowIdentifier][currentTabId].navigation.activeTabsByLevel = activeTabsByLevel;

        return newState;
      });
    },
    []
  );

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
      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
      cleanupWindow,
      getAllState,
    }),
    [
      getTableState,
      getNavigationState,
      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      setTableImplicitFilterApplied,
      setNavigationActiveLevels,
      setNavigationActiveTabsByLevel,
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
