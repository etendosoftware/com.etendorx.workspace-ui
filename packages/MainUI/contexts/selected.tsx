'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Graph from '@/data/graph';
import { useMetadataContext } from '@/hooks/useMetadataContext';

interface SelectedContext {
  graph: Graph<Tab>;
  level: number;
}

const SelectContext = createContext<SelectedContext>({} as SelectedContext);

export const SelectedProvider = ({ children }: React.PropsWithChildren) => {
  const [version, setVersion] = useState(0);
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

  const value = useMemo<SelectedContext>(
    () => ({
      version,
      graph,
      level,
    }),
    [version, graph, level],
  );

  return <SelectContext.Provider value={value}>{children}</SelectContext.Provider>;
};

export const useSelected = () => {
  const graph = useContext(SelectContext);

  if (!graph) throw new Error('useSelected must be used within a SelectedProvider');

  return graph;
};

export default SelectedProvider;
