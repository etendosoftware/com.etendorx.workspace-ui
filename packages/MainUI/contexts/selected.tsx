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

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  setActiveLevel: (level: number, expand?: boolean) => void;
  clearAllStates: () => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

const windowGraphCache = new Map<string, Graph<Tab>>();

export const SelectedProvider = ({
  children,
  tabs,
  windowId,
  windowIdentifier,
}: React.PropsWithChildren<{
  tabs: Tab[];
  windowId: string;
  windowIdentifier?: string;
}>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);

  // Use windowIdentifier for cache key to support multiple instances of same window
  const cacheKey = windowIdentifier || windowId;

  const graph = useMemo(() => {
    if (!windowGraphCache.has(cacheKey)) {
      windowGraphCache.set(cacheKey, new Graph<Tab>(tabs));
    }
    const cachedGraph = windowGraphCache.get(cacheKey);
    if (!cachedGraph) {
      throw new Error(`Failed to retrieve graph for window identifier: ${cacheKey}`);
    }
    return cachedGraph;
  }, [cacheKey, tabs]);

  const clearAllStates = useCallback(() => {
    setActiveLevels([0]);

    for (const tab of tabs) {
      graph.clearSelected(tab);
      graph.clearSelectedMultiple(tab);
    }
  }, [tabs, graph]);

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
        return [maxLevel, level];
      });
    },
    [tabs]
  );

  const value = useMemo<SelectedContext>(
    () => ({
      graph,
      activeLevels,
      setActiveLevel,
      clearAllStates,
    }),
    [graph, activeLevels, setActiveLevel, clearAllStates]
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
