import { createContext, useContext, useMemo, useEffect, useState } from "react";
import type { EntityData, Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { ToolbarProvider } from "./ToolbarContext";
import { SearchProvider } from "./searchContext";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

interface TabContextI {
  tab: Tab;
  record?: EntityData | null;
  parentTab?: Tab | null;
  parentRecord?: EntityData | null;
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const { graph } = useSelected();
  const { activeWindow, getSelectedRecord } = useMultiWindowURL();

  const [_graphUpdateCounter, setGraphUpdateCounter] = useState(0);

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window;

  const isCorrectWindow = windowId === currentWindowId;

  const parentTab = useMemo(() => {
    if (!isCorrectWindow) return null;
    return graph.getParent(tab);
  }, [graph, tab, isCorrectWindow]);

  useEffect(() => {
    if (!parentTab || !isCorrectWindow) return;

    const handleParentSelection = (eventTab: Tab) => {
      if (parentTab.id === eventTab.id && eventTab.window === currentWindowId) {
        setGraphUpdateCounter((prev) => prev + 1);
      }
    };

    const handleParentClear = (eventTab: Tab) => {
      if (parentTab.id === eventTab.id && eventTab.window === currentWindowId) {
        setGraphUpdateCounter((prev) => prev + 1);
      }
    };

    graph.addListener("selected", handleParentSelection);
    graph.addListener("unselected", handleParentClear);

    return () => {
      graph.removeListener("selected", handleParentSelection);
      graph.removeListener("unselected", handleParentClear);
    };
  }, [graph, parentTab, tab.id, isCorrectWindow, currentWindowId]);

  const record = useMemo(() => {
    if (!windowId || !isCorrectWindow) return null;

    const selectedRecordId = getSelectedRecord(windowId, tab.id);
    if (!selectedRecordId) return null;

    const recordFromURL = { id: selectedRecordId } as EntityData;

    return recordFromURL;
  }, [windowId, tab.id, getSelectedRecord, isCorrectWindow]);

  const parentRecord = useMemo(() => {
    if (!windowId || !parentTab || !isCorrectWindow) {
      return null;
    }

    const parentSelectedRecordId = getSelectedRecord(windowId, parentTab.id);
    if (parentSelectedRecordId) {
      const parentRecordFromURL = { id: parentSelectedRecordId } as EntityData;
      return parentRecordFromURL;
    }

    const parentRecordFromGraph = graph.getSelected(parentTab);
    if (parentRecordFromGraph) {
      return parentRecordFromGraph;
    }

    return null;
  }, [windowId, parentTab, isCorrectWindow, getSelectedRecord, graph]);

  const value = useMemo(
    () => ({
      tab,
      record,
      parentTab,
      parentRecord,
    }),
    [parentRecord, parentTab, record, tab]
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
