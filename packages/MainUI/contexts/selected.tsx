"use client";

import Graph from "@/data/graph";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { createContext, useCallback, useMemo, useState } from "react";

interface TabStates {
  [tabId: string]: {
    recordId: string;
    mode: "table" | "form";
  };
}

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  tabStates: TabStates;
  setActiveLevel: (level: number, expand?: boolean) => void;
  setTabRecordId: (tabId: string, recordId: string) => void;
  getTabRecordId: (tabId: string) => string;
  clearTabRecord: (tabId: string) => void;
  clearAllStates: () => void; // ✅ NUEVO: Para limpiar al cambiar de ventana
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

const windowGraphCache = new Map<string, Graph<Tab>>();

export const SelectedProvider = ({
  children,
  tabs,
  windowId, // ✅ NUEVO: Recibir windowId como prop
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
}>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const [tabStates, setTabStates] = useState<TabStates>({});

  // ✅ OBTENER O CREAR graph específico para esta ventana
  const graph = useMemo(() => {
    if (!windowGraphCache.has(windowId)) {
      console.log(`[SelectedProvider] Creating new graph for window: ${windowId}`);
      windowGraphCache.set(windowId, new Graph<Tab>(tabs));
    } else {
      console.log(`[SelectedProvider] Reusing existing graph for window: ${windowId}`);
    }
    return windowGraphCache.get(windowId)!;
  }, [windowId, tabs]);

  // ✅ LIMPIAR estados cuando cambia de ventana
  const clearAllStates = useCallback(() => {
    console.log(`[SelectedProvider] Clearing all states for window: ${windowId}`);
    setTabStates({});
    setActiveLevels([0]);

    // ✅ También limpiar todas las selecciones del graph
    for (const tab of tabs) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [windowId, tabs, graph]);

  const setTabRecordId = useCallback((tabId: string, recordId: string) => {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: {
        recordId,
        mode: recordId ? "form" : "table",
      },
    }));
  }, []);

  const getTabRecordId = useCallback(
    (tabId: string) => {
      return tabStates[tabId]?.recordId || "";
    },
    [tabStates]
  );

  const clearTabRecord = useCallback((tabId: string) => {
    setTabStates((prev) => {
      const newState = { ...prev };
      delete newState[tabId];
      return newState;
    });
  }, []);

  const setActiveLevel = useCallback(
    (level: number, expand?: boolean) => {
      setActiveLevels((prev) => {
        if (expand) {
          return [level];
        }

        const maxLevel = prev[prev.length - 1];

        if (level === 0) {
          return [0];
        }
        if (maxLevel === level) {
          return prev;
        }
        if (maxLevel > level) {
          return [level - 1, level];
        }
        if (maxLevel > level) {
          setTabStates((currentStates) => {
            const newStates = { ...currentStates };
            for (const tabId of Object.keys(newStates)) {
              const tab = tabs.find((t) => t.id === tabId);
              if (tab && tab.tabLevel > level) {
                delete newStates[tabId];
              }
            }
            return newStates;
          });
          return [level - 1, level];
        }
        return [maxLevel, level];
      });
    },
    [tabs]
  );

  const value = useMemo<SelectedContext>(
    () => ({
      graph,
      activeLevels,
      tabStates,
      setActiveLevel,
      setTabRecordId,
      getTabRecordId,
      clearTabRecord,
      clearAllStates,
    }),
    [activeLevels, graph, setActiveLevel, tabStates, setTabRecordId, getTabRecordId, clearTabRecord, clearAllStates]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
