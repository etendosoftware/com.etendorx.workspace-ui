"use client";

import Graph, { type GraphEventListener } from "@/data/graph";
import { useSetSession } from "@/hooks/useSetSession";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  setActiveLevel: (level: number, expand?: boolean) => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children, tabs }: React.PropsWithChildren<{ tabs: Tab[] }>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const setSession = useSetSession();
  const graph = useRef(new Graph<Tab>(tabs)).current;

  const setActiveLevel = useCallback((level: number, expand?: boolean) => {
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
  }, []);

  const value = useMemo<SelectedContext>(
    () => ({
      graph,
      activeLevels,
      setActiveLevel,
    }),
    [activeLevels, graph, setActiveLevel],
  );

  useEffect(() => {
    const handleSelected: GraphEventListener<"selected"> = (tab, record) => {
      setActiveLevel(tab.tabLevel + 1);
      setSession(record, tab);
    };

    const handleUnselected: GraphEventListener<"unselected"> = (tab) => {
      setActiveLevel(tab.tabLevel);
    };

    graph //
      .on("selected", handleSelected)
      .on("unselected", handleUnselected);

    return () => {
      graph //
        .off("selected", handleSelected)
        .off("unselected", handleUnselected);
    };
  }, [graph, setSession, setActiveLevel]);

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
