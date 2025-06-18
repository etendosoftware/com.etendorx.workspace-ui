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

  // ✅ Estado local para forzar re-renders cuando cambie el graph
  const [graphUpdateCounter, setGraphUpdateCounter] = useState(0);

  const windowId = activeWindow?.windowId;
  const currentWindowId = tab.window; // ✅ WindowId del tab actual

  // ✅ VALIDACIÓN: Solo procesar si estamos en la ventana correcta
  const isCorrectWindow = windowId === currentWindowId;

  console.log(`[TabContext ${tab.id}] Window validation:`, {
    tabId: tab.id,
    tabWindowId: currentWindowId,
    activeWindowId: windowId,
    isCorrectWindow,
  });

  // ✅ Obtener parentTab desde graph (estructura no cambia)
  const parentTab = useMemo(() => {
    if (!isCorrectWindow) return null;
    return graph.getParent(tab);
  }, [graph, tab, isCorrectWindow]);

  // ✅ ESCUCHAR eventos del graph SOLO para la ventana correcta
  useEffect(() => {
    if (!parentTab || !isCorrectWindow) return;

    const handleParentSelection = (eventTab: Tab, record: EntityData) => {
      // ✅ VALIDACIÓN ADICIONAL: Verificar que el tab del evento pertenece a esta ventana
      if (parentTab.id === eventTab.id && eventTab.window === currentWindowId) {
        console.log(`[TabContext ${tab.id}] Parent ${parentTab.id} selection changed:`, record.id);
        setGraphUpdateCounter((prev) => prev + 1); // Forzar re-render
      }
    };

    const handleParentClear = (eventTab: Tab) => {
      // ✅ VALIDACIÓN ADICIONAL: Verificar que el tab del evento pertenece a esta ventana
      if (parentTab.id === eventTab.id && eventTab.window === currentWindowId) {
        console.log(`[TabContext ${tab.id}] Parent ${parentTab.id} selection cleared`);
        setGraphUpdateCounter((prev) => prev + 1); // Forzar re-render
      }
    };

    graph.addListener("selected", handleParentSelection);
    graph.addListener("unselected", handleParentClear);

    return () => {
      graph.removeListener("selected", handleParentSelection);
      graph.removeListener("unselected", handleParentClear);
    };
  }, [graph, parentTab, tab.id, isCorrectWindow, currentWindowId]);

  // ✅ Obtener registro actual desde URL directamente
  const record = useMemo(() => {
    if (!windowId || !isCorrectWindow) return null;

    const selectedRecordId = getSelectedRecord(windowId, tab.id);
    if (!selectedRecordId) return null;

    // Crear objeto con ID (suficiente para la mayoría de casos)
    const recordFromURL = { id: selectedRecordId } as EntityData;

    console.log(`[TabContext ${tab.id}] Current record from URL:`, selectedRecordId);
    return recordFromURL;
  }, [windowId, tab.id, getSelectedRecord, isCorrectWindow]);

  // ✅ HÍBRIDO: Primero URL, fallback a graph para mejor compatibilidad
  const parentRecord = useMemo(() => {
    if (!windowId || !parentTab || !isCorrectWindow) {
      console.log(`[TabContext ${tab.id}] No parent or window or wrong window:`, {
        windowId,
        parentTabId: parentTab?.id,
        isCorrectWindow,
      });
      return null;
    }

    // ✅ Intentar primero desde URL
    const parentSelectedRecordId = getSelectedRecord(windowId, parentTab.id);
    if (parentSelectedRecordId) {
      const parentRecordFromURL = { id: parentSelectedRecordId } as EntityData;
      console.log(`[TabContext ${tab.id}] Parent record from URL:`, {
        parentTabId: parentTab.id,
        parentRecordId: parentSelectedRecordId,
        windowId,
      });
      return parentRecordFromURL;
    }

    // ✅ Fallback: Intentar desde graph (por si el graph tiene data más completa)
    const parentRecordFromGraph = graph.getSelected(parentTab);
    if (parentRecordFromGraph) {
      console.log(`[TabContext ${tab.id}] Parent record from graph:`, {
        parentTabId: parentTab.id,
        parentRecordId: parentRecordFromGraph.id,
      });
      return parentRecordFromGraph;
    }

    console.log(`[TabContext ${tab.id}] No parent record found`);
    return null;
  }, [windowId, parentTab, getSelectedRecord, graph, graphUpdateCounter, isCorrectWindow]);

  const value = useMemo(
    () => ({
      tab,
      record,
      parentTab,
      parentRecord,
    }),
    [parentRecord, parentTab, record, tab]
  );

  console.log(`[TabContext ${tab.id}] Final context:`, {
    tabId: tab.id,
    windowId,
    recordId: record?.id,
    parentTabId: parentTab?.id,
    parentRecordId: parentRecord?.id,
    updateCounter: graphUpdateCounter,
    isCorrectWindow,
  });

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
