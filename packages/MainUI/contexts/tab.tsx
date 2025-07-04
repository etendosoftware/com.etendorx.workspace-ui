import { createContext, useContext, useMemo } from "react";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
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
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const { graph } = useSelected();
  const record = useSelectedRecord(tab);
  const parentTab = graph.getParent(tab);
  const parentRecord = useSelectedRecord(parentTab);
  const parentRecords = useSelectedRecords(parentTab);

  const value = useMemo(
    () => ({
      tab,
      record,
      parentTab,
      parentRecord,
      parentRecords,
    }),
    [parentRecord, parentTab, parentRecords, record, tab]
  );

  return (
    <TabContext.Provider value={value}>
      <ToolbarProvider>
        <SearchProvider>{children}</SearchProvider>
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
