"use client";

import Graph from "@/data/graph";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

interface TabStates {
  [tabId: string]: {
    recordId: string;
    mode: "table" | "form";
  };
}

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  tabStates: TabStates; // ← Nuevo estado por tab
  setActiveLevel: (level: number, expand?: boolean) => void;
  setTabRecordId: (tabId: string, recordId: string) => void;
  getTabRecordId: (tabId: string) => string;
  clearTabRecord: (tabId: string) => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children, tabs }: React.PropsWithChildren<{ tabs: Tab[] }>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const [tabStates, setTabStates] = useState<TabStates>({});
  const graph = useRef(new Graph<Tab>(tabs)).current;

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
    }),
    [activeLevels, graph, setActiveLevel, tabStates, setTabRecordId, getTabRecordId, clearTabRecord]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
