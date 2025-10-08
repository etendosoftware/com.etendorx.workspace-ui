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
}

interface TabState {
  table: TableState;
}

interface WindowState {
  [tabId: string]: TabState;
}

interface TableStatePersistenceState {
  [windowId: string]: WindowState;
}

interface TableStatePersistenceContextI {
  // State getters
  getTableState: (windowId: string, tabId: string) => TableState;

  // State setters
  setTableFilters: (windowId: string, tabId: string, filters: MRT_ColumnFiltersState) => void;
  setTableVisibility: (windowId: string, tabId: string, visibility: MRT_VisibilityState) => void;
  setTableSorting: (windowId: string, tabId: string, sorting: MRT_SortingState) => void;
  setTableOrder: (windowId: string, tabId: string, order: string[]) => void;

  // Window management
  cleanupWindow: (windowId: string) => void;

  // Debug/utility
  getAllState: () => TableStatePersistenceState;
}

// Context creation
const TableStatePersistenceContext = createContext<TableStatePersistenceContextI | undefined>(undefined);

// Provider component
export default function TableStatePersistenceProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<TableStatePersistenceState>({});

  const getTableState = useCallback(
    (windowId: string, tabId: string): TableState => {
      const defaultState: TableState = {
        filters: [],
        visibility: {},
        sorting: [],
        order: [],
      };

      if (!state[windowId] || !state[windowId][tabId]) {
        return defaultState;
      }

      return state[windowId][tabId].table || defaultState;
    },
    [state]
  );

  const setTableFilters = useCallback((windowId: string, tabId: string, filters: MRT_ColumnFiltersState) => {
    setState((prevState) => {
      const newState = { ...prevState };

      if (!newState[windowId]) {
        newState[windowId] = {};
      }

      if (!newState[windowId][tabId]) {
        newState[windowId][tabId] = {
          table: {
            filters: [],
            visibility: {},
            sorting: [],
            order: [],
          },
        };
      }

      newState[windowId][tabId].table.filters = filters;
      return newState;
    });
  }, []);

  const setTableVisibility = useCallback((windowId: string, tabId: string, visibility: MRT_VisibilityState) => {
    setState((prevState) => {
      const newState = { ...prevState };

      if (!newState[windowId]) {
        newState[windowId] = {};
      }

      if (!newState[windowId][tabId]) {
        newState[windowId][tabId] = {
          table: {
            filters: [],
            visibility: {},
            sorting: [],
            order: [],
          },
        };
      }
      const currentVisibility = newState[windowId][tabId].table.visibility;
      newState[windowId][tabId].table.visibility = { ...currentVisibility, ...visibility };
      return newState;
    });
  }, []);

  const setTableSorting = useCallback((windowId: string, tabId: string, sorting: MRT_SortingState) => {
    setState((prevState) => {
      const newState = { ...prevState };

      if (!newState[windowId]) {
        newState[windowId] = {};
      }

      if (!newState[windowId][tabId]) {
        newState[windowId][tabId] = {
          table: {
            filters: [],
            visibility: {},
            sorting: [],
            order: [],
          },
        };
      }

      newState[windowId][tabId].table.sorting = sorting;
      return newState;
    });
  }, []);

  const setTableOrder = useCallback((windowId: string, tabId: string, order: string[]) => {
    setState((prevState) => {
      const newState = { ...prevState };

      if (!newState[windowId]) {
        newState[windowId] = {};
      }

      if (!newState[windowId][tabId]) {
        newState[windowId][tabId] = {
          table: {
            filters: [],
            visibility: {},
            sorting: [],
            order: [],
          },
        };
      }

      newState[windowId][tabId].table.order = order;
      return newState;
    });
  }, []);

  const cleanupWindow = useCallback((windowId: string) => {
    setState((prevState) => {
      const newState = { ...prevState };
      delete newState[windowId];
      return newState;
    });
  }, []);

  const getAllState = useCallback(() => {
    return state;
  }, [state]);

  const value = useMemo(
    () => ({
      getTableState,
      setTableFilters,
      setTableVisibility,
      setTableSorting,
      setTableOrder,
      cleanupWindow,
      getAllState,
    }),
    [getTableState, setTableFilters, setTableVisibility, setTableSorting, setTableOrder, cleanupWindow, getAllState]
  );

  return <TableStatePersistenceContext.Provider value={value}>{children}</TableStatePersistenceContext.Provider>;
}

// Hook
export const useTableStatePersistence = () => {
  const context = useContext(TableStatePersistenceContext);

  if (!context) {
    throw new Error("useTableStatePersistence must be used within a TableStatePersistenceProvider");
  }

  return context;
};
