'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Graph from '@/data/graph';
import { useMetadataContext } from '@/hooks/useMetadataContext';

interface SelectedContext {
  graph: Graph<Tab>;
  level: number;
  activeLevels: number[];
  setActiveLevel: (level: number) => void;
}

const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children }: React.PropsWithChildren) => {
  const [version, setVersion] = useState(0);
  const [activeLevels, setActiveLevels] = useState<number[]>([0]);
  const { window } = useMetadataContext();
  const tabs = window?.tabs;

  const graph = useMemo(() => {
    const result = new Graph<Tab>();

    if (tabs) {
      result.buildTreeFromTabs(tabs);
    }

    result.on('update', () => {
      setVersion(v => v + 1);
    });

    return result;
  }, [tabs]);

  const level = graph.getLevel();

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

  useEffect(() => {
    graph.addListener('update', nose => {
      console.debug({ nose });
    });
  }, [graph]);

  const value = useMemo<SelectedContext>(
    () => ({
      version,
      graph,
      level,
      activeLevels,
      setActiveLevel,
    }),
    [activeLevels, graph, level, version, setActiveLevel],
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export const useSelected = () => {
  const graph = useContext(SelectContext);

  if (!graph) throw new Error('useSelected must be used within a SelectedProvider');

  return graph;
};

export default SelectedProvider;
