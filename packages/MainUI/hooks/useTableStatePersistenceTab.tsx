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
import type { MRT_ColumnFiltersState, MRT_VisibilityState, MRT_SortingState } from "material-react-table";
import { useWindowContext } from "@/contexts/window";
import { getNewActiveLevels, getNewActiveTabsByLevel } from "@/utils/table/utils";
import type { Tab } from "@workspaceui/api-client/src/api/types";

interface UseTableStatePersistenceTabReturn {
  // State getters
  tableColumnFilters: MRT_ColumnFiltersState;
  tableColumnVisibility: MRT_VisibilityState;
  tableColumnSorting: MRT_SortingState;
  tableColumnOrder: string[];
  isImplicitFilterApplied: boolean | undefined;

  advancedCriteria?: any;
  activeLevels: number[];
  activeTabsByLevel: Map<number, string>;

  // State setters
  setTableColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  setTableColumnVisibility: React.Dispatch<React.SetStateAction<MRT_VisibilityState>>;
  setTableColumnSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
  setTableColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setIsImplicitFilterApplied: (value: boolean) => void;
  setAdvancedCriteria: (criteria: any) => void;
  setActiveLevel: (level: number, expand?: boolean) => void;
  setActiveTabsByLevel: (tab?: Tab) => void;
}

export const useTableStatePersistenceTab = ({
  windowIdentifier,
  tabId,
  tabLevel = 0,
}: {
  windowIdentifier: string;
  tabId: string;
  tabLevel?: number;
}): UseTableStatePersistenceTabReturn => {
  const {
    getTableState,
    getNavigationState,
    setTableFilters,
    setTableVisibility,
    setTableSorting,
    setTableOrder,
    setTableImplicitFilterApplied,
    setTableAdvancedCriteria,
    setNavigationActiveLevels,
    setNavigationActiveTabsByLevel,
  } = useWindowContext();

  // Get current state values — called directly (no useMemo) so we always read
  // from stateRef on every render.  getTableState / getNavigationState are now
  // stable callbacks that read through a ref, so the returned object reference
  // only changes when the underlying data actually changed.  This means:
  //   • On window switch: same tab-state object → no downstream effect reruns.
  //   • On filter/sort update: new tab-state object → downstream effects DO rerun.
  const currentTableState = getTableState(windowIdentifier, tabId);
  const currentNavigationState = getNavigationState(windowIdentifier);

  // ---------------------------------------------------------------------------
  // Stable setter callbacks — getTableState / getNavigationState are now stable
  // (they read through a ref), so they are safe to call inside setters without
  // being listed as reactive deps.
  // ---------------------------------------------------------------------------
  const setTableColumnFilters = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const currentFilters = getTableState(windowIdentifier, tabId).filters;
      const newFilters = typeof updaterOrValue === "function" ? updaterOrValue(currentFilters) : updaterOrValue;
      setTableFilters(windowIdentifier, tabId, newFilters, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableFilters] // getTableState omitted — stable ref-reader
  );

  const setTableColumnVisibility = useCallback(
    (updaterOrValue: MRT_VisibilityState | ((prev: MRT_VisibilityState) => MRT_VisibilityState)) => {
      const currentVisibility = getTableState(windowIdentifier, tabId).visibility;
      const newVisibility = typeof updaterOrValue === "function" ? updaterOrValue(currentVisibility) : updaterOrValue;
      setTableVisibility(windowIdentifier, tabId, newVisibility, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableVisibility]
  );

  const setTableColumnSorting = useCallback(
    (updaterOrValue: MRT_SortingState | ((prev: MRT_SortingState) => MRT_SortingState)) => {
      const currentSorting = getTableState(windowIdentifier, tabId).sorting;
      const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(currentSorting) : updaterOrValue;
      setTableSorting(windowIdentifier, tabId, newSorting, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableSorting]
  );

  const setTableColumnOrder = useCallback(
    (updaterOrValue: string[] | ((prev: string[]) => string[])) => {
      const currentOrder = getTableState(windowIdentifier, tabId).order;
      const newOrder = typeof updaterOrValue === "function" ? updaterOrValue(currentOrder) : updaterOrValue;
      setTableOrder(windowIdentifier, tabId, newOrder, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableOrder]
  );

  const setIsImplicitFilterApplied = useCallback(
    (value: boolean) => {
      setTableImplicitFilterApplied(windowIdentifier, tabId, value, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableImplicitFilterApplied]
  );

  const setAdvancedCriteria = useCallback(
    (criteria: any) => {
      setTableAdvancedCriteria(windowIdentifier, tabId, criteria, tabLevel);
    },
    [windowIdentifier, tabId, tabLevel, setTableAdvancedCriteria]
  );

  const setActiveLevel = useCallback(
    (level: number, expand?: boolean) => {
      const currentActiveLevels = getNavigationState(windowIdentifier).activeLevels;
      const newActiveLevels = getNewActiveLevels(currentActiveLevels, level, expand);
      setNavigationActiveLevels(windowIdentifier, newActiveLevels);
    },
    [windowIdentifier, setNavigationActiveLevels] // getNavigationState omitted — stable ref-reader
  );

  const setActiveTabsByLevel = useCallback(
    (tab?: Tab) => {
      if (!tab) {
        setNavigationActiveTabsByLevel(windowIdentifier, new Map());
        return;
      }
      const currentActiveTabsByLevel = getNavigationState(windowIdentifier).activeTabsByLevel;
      const newActiveTabs = getNewActiveTabsByLevel(currentActiveTabsByLevel, tab.tabLevel, tab.id);
      setNavigationActiveTabsByLevel(windowIdentifier, newActiveTabs);
    },
    [windowIdentifier, setNavigationActiveTabsByLevel]
  );

  return {
    // State getters - current values
    tableColumnFilters: currentTableState.filters,
    tableColumnVisibility: currentTableState.visibility,
    tableColumnSorting: currentTableState.sorting,
    tableColumnOrder: currentTableState.order,
    isImplicitFilterApplied: currentTableState.isImplicitFilterApplied,
    advancedCriteria: currentTableState.advancedCriteria,
    activeLevels: currentNavigationState.activeLevels,
    activeTabsByLevel: currentNavigationState.activeTabsByLevel,

    // State setters - React-style setters
    setTableColumnFilters,
    setTableColumnVisibility,
    setTableColumnSorting,
    setTableColumnOrder,
    setIsImplicitFilterApplied,
    setAdvancedCriteria,
    setActiveLevel,
    setActiveTabsByLevel,
  };
};
