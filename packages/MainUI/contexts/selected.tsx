import { createContext, useContext, useMemo, useState } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Graph from '@/data/graph';
import { useMetadataContext } from '@/hooks/useMetadataContext';

const SelectContext = createContext<Graph<Tab> | null>(null);

export const SelectedProvider = ({ children }: React.PropsWithChildren) => {
  const [, setVersion] = useState(0);
  const { window } = useMetadataContext();
  const tabs = window?.tabs;

  const graph = useMemo(() => {
    const result = new Graph<Tab>();

    if (tabs) {
      result.buildTreeFromTabs(tabs);
    }

    result.on('update', () => setVersion(v => v + 1));

    return result;
  }, [tabs]);

  return <SelectContext.Provider value={graph}>{children}</SelectContext.Provider>;
};

export const useSelected = () => {
  const graph = useContext(SelectContext);

  if (!graph) throw new Error('useSelected must be used within a SelectedProvider');

  return graph;
};

export default SelectedProvider;
