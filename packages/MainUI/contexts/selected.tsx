'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Graph, { type GraphEventListener } from '@/data/graph';

interface SelectedContext {
  graph: Graph<Tab>;
  activeLevels: number[];
  setActiveLevel: (level: number) => void;
}

const SelectContext = createContext<SelectedContext>({} as SelectedContext);

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

export const useSelected = () => {
  const graph = useContext(SelectContext);

  if (!graph) throw new Error('useSelected must be used within a SelectedProvider');

  return graph;
};

export const useSelectedRecord = (tab?: Tab) => {
  const { graph } = useSelected();
  const [selected, setSelected] = useState(graph.getSelected(tab));

  useEffect(() => {
    if (!tab) return;

    const handleSelect: GraphEventListener<'selected'> = (eventTab, record) => {
      if (tab.id === eventTab.id) {
        setSelected(record);
      }
    };

    const handleUnselect: GraphEventListener<'unselected'> = eventTab => {
      if (tab.id === eventTab.id) {
        setSelected(undefined);
      }
    };

    graph.addListener('selected', handleSelect).addListener('unselected', handleUnselect);

    return () => {
      graph.removeListener('selected', handleSelect).removeListener('unselected', handleUnselect);
    };
  }, [graph, tab]);

  return selected;
};

export const useSelectedRecords = (tab?: Tab) => {
  const { graph } = useSelected();
  const [selected, setSelected] = useState(() => {
    const selected = graph.getSelectedMultiple(tab);

    return selected || [];
  });

  useEffect(() => {
    if (!tab) return;

    const handleSelectMultiple: GraphEventListener<'selectedMultiple'> = (eventTab, records) => {
      if (tab.id === eventTab.id) {
        setSelected(records);
      }
    };

    const handleUnselectMultiple: GraphEventListener<'unselectedMultiple'> = eventTab => {
      if (tab.id === eventTab.id) {
        setSelected([]);
      }
    };

    graph
      .addListener('selectedMultiple', handleSelectMultiple)
      .addListener('unselectedMultiple', handleUnselectMultiple);

    return () => {
      graph
        .removeListener('selectedMultiple', handleSelectMultiple)
        .removeListener('unselectedMultiple', handleUnselectMultiple);
    };
  }, [graph, tab]);

  return selected;
};

export default SelectedProvider;
