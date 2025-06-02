"use client";

import Graph from "@/data/graph";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  setActiveLevel: (level: number, expand?: boolean) => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children, tabs }: React.PropsWithChildren<{ tabs: Tab[] }>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const graph = useRef(new Graph<Tab>(tabs)).current;

  const setActiveLevel = useCallback((level: number, expand?: boolean) => {
    setActiveLevels((prev) => {
      console.debug({ level, expand });
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

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export default SelectedProvider;
