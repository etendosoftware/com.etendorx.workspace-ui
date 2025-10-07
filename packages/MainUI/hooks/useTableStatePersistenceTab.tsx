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

import { useCallback } from "react";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import { useTableStatePersistence } from "@/contexts/tableStatePersistence";

interface UseTableStatePersistenceTabReturn {
  // State getters
  tableColumnFilters: MRT_ColumnFiltersState;
  tableColumnVisibility: MRT_VisibilityState;
  tableColumnSorting: MRT_SortingState;
  tableColumnOrder: string[];

  // State setters
  setTableColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  setTableColumnVisibility: React.Dispatch<React.SetStateAction<MRT_VisibilityState>>;
  setTableColumnSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
  setTableColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useTableStatePersistenceTab = (windowId: string, tabId: string): UseTableStatePersistenceTabReturn => {
  const { getTableState, setTableFilters, setTableVisibility, setTableSorting, setTableOrder } =
    useTableStatePersistence();

  // Get current state values
  const currentState = getTableState(windowId, tabId);

  // Create React-style setters that support both direct values and updater functions
  const setTableColumnFilters = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const currentFilters = getTableState(windowId, tabId).filters;
      const newFilters = typeof updaterOrValue === "function" ? updaterOrValue(currentFilters) : updaterOrValue;
      setTableFilters(windowId, tabId, newFilters);
    },
    [windowId, tabId, getTableState, setTableFilters]
  );

  const setTableColumnVisibility = useCallback(
    (updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)) => {
      const currentVisibility = getTableState(windowId, tabId).visibility;
      const newVisibility = typeof updaterOrValue === "function" ? updaterOrValue(currentVisibility) : updaterOrValue;
      setTableVisibility(windowId, tabId, newVisibility);
    },
    [windowId, tabId, getTableState, setTableVisibility]
  );

  const setTableColumnSorting = useCallback(
    (updaterOrValue: MRT_SortingState | ((prev: MRT_SortingState) => MRT_SortingState)) => {
      const currentSorting = getTableState(windowId, tabId).sorting;
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(currentSorting) : updaterOrValue;
      setTableSorting(windowId, tabId, newSorting);
    },
    [windowId, tabId, getTableState, setTableSorting]
  );

  const setTableColumnOrder = useCallback(
    (updaterOrValue: string[] | ((prev: string[]) => string[])) => {
      const currentOrder = getTableState(windowId, tabId).order;
      const newOrder = typeof updaterOrValue === "function" ? updaterOrValue(currentOrder) : updaterOrValue;
      setTableOrder(windowId, tabId, newOrder);
    },
    [windowId, tabId, getTableState, setTableOrder]
  );

  return {
    // State getters - current values
    tableColumnFilters: currentState.filters,
    tableColumnVisibility: currentState.visibility,
    tableColumnSorting: currentState.sorting,
    tableColumnOrder: currentState.order,

    // State setters - React-style setters
    setTableColumnFilters,
    setTableColumnVisibility,
    setTableColumnSorting,
    setTableColumnOrder,
  };
};
