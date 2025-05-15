'use client';

import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import type { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Graph from '@/data/graph';

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  setActiveLevel: (level: number) => void;
}

export const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children, tabs }: React.PropsWithChildren<{ tabs: Tab[] }>) => {
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const graph = useRef(new Graph<Tab>(tabs)).current;

  const setActiveLevel = useCallback((level: number) => {
    setActiveLevels(prev => {
      // If the clicked tab is already active, collapse all deeper levels
      const trimmed = prev.filter(lvl => lvl < level);

      // Add the clicked level back if it was not the last clicked
      if (trimmed[trimmed.length - 1] !== level) {
        return [...trimmed, level].slice(-2);
      }

      return trimmed;
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
