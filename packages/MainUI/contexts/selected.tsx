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

"use client";

import Graph from "@/data/graph";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { createContext, useCallback, useMemo, useState } from "react";
import { type TabMode, TAB_MODES } from "@/utils/url/constants";

interface TabStates {
  [tabId: string]: {
    recordId: string;
    mode: TabMode;
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
  clearAllStates: () => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

const windowGraphCache = new Map<string, Graph<Tab>>();

export const SelectedProvider = ({
  children,
  tabs,
  windowId,
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
}>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const [tabStates, setTabStates] = useState<TabStates>({});

  const graph = useMemo(() => {
    if (!windowGraphCache.has(windowId)) {
      windowGraphCache.set(windowId, new Graph<Tab>(tabs));
    }
    const cachedGraph = windowGraphCache.get(windowId);
    if (!cachedGraph) {
      throw new Error(`Failed to retrieve graph for window id: ${windowId}`);
    }
    return cachedGraph;
  }, [windowId, tabs]);

  const clearAllStates = useCallback(() => {
    setTabStates({});
    setActiveLevels([0]);

    for (const tab of tabs) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [tabs, graph]);

  const setTabRecordId = useCallback((tabId: string, recordId: string) => {
    setTabStates((prev) => ({
      ...prev,
      [tabId]: {
        recordId,
        mode: recordId ? TAB_MODES.FORM : TAB_MODES.TABLE,
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
