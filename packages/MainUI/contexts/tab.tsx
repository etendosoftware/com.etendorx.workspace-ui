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
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_VisibilityState, MRT_ColumnFiltersState, MRT_SortingState } from "material-react-table";
import { ToolbarProvider } from "./ToolbarContext";
import { SearchProvider } from "./searchContext";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useSelected } from "@/hooks/useSelected";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";

interface TabContextI {
  tab: Tab;
  record?: EntityData | null;
  parentTab?: Tab | null;
  parentRecord?: EntityData | null;
  parentRecords?: EntityData[] | null;
  hasFormChanges: boolean;
  markFormAsChanged: () => void;
  resetFormChanges: () => void;

  // Table related states
  tableColumnFilters: MRT_ColumnFiltersState;
  setTableColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
  tableColumnVisibility: MRT_VisibilityState;
  setTableColumnVisibility: React.Dispatch<React.SetStateAction<MRT_VisibilityState>>;
  tableColumnSorting: MRT_SortingState;
  setTableColumnSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const [hasFormChanges, setHasFormChanges] = useState(false);

  // Table related states
  const [tableColumnFilters, setTableColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [tableColumnVisibility, setTableColumnVisibility] = useState<MRT_VisibilityState>({});
  const [tableColumnSorting, setTableColumnSorting] = useState<MRT_SortingState>([]);

  const { graph } = useSelected();
  const record = useSelectedRecord(tab);
  const parentTab = graph.getParent(tab);
  const parentRecord = useSelectedRecord(parentTab);
  const parentRecords = useSelectedRecords(parentTab);

  const markFormAsChanged = useCallback(() => setHasFormChanges(true), []);
  const resetFormChanges = useCallback(() => setHasFormChanges(false), []);

  const value = useMemo(
    () => ({
      tab,
      record,
      parentTab,
      parentRecord,
      parentRecords,
      hasFormChanges,
      markFormAsChanged,
      resetFormChanges,

      // Table related states
      tableColumnFilters,
      setTableColumnFilters,
      tableColumnVisibility,
      setTableColumnVisibility,
      tableColumnSorting,
      setTableColumnSorting,
    }),
    [
      parentRecord,
      parentTab,
      parentRecords,
      record,
      tab,
      hasFormChanges,
      markFormAsChanged,
      resetFormChanges,
      tableColumnFilters,
      setTableColumnFilters,
      tableColumnVisibility,
      setTableColumnVisibility,
      tableColumnSorting,
      setTableColumnSorting,
    ]
  );

  return (
    <TabContext.Provider value={value}>
      <ToolbarProvider data-testid="ToolbarProvider__24e3a6">
        <SearchProvider data-testid="SearchProvider__24e3a6">{children}</SearchProvider>
      </ToolbarProvider>
    </TabContext.Provider>
  );
}

export const useTabContext = () => {
  const context = useContext(TabContext);

  if (!context) {
    throw new Error("useTabContext must be used within a TabContextProvider");
  }

  return context;
};
