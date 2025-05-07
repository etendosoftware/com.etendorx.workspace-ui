import { createContext, useContext, useMemo } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { ToolbarProvider } from './ToolbarContext';
import { SearchProvider } from './searchContext';
import { useSelected } from './selected';

interface TabContextI {
  tab: Tab;
  record?: EntityData | null;
  parentTab?: Tab | null;
  parentRecord?: EntityData | null;
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const graph = useSelected();
  const record = graph.getSelected(tab.id);
  const parentTab = graph.getParent(tab.id);
  const parentRecord = graph.getSelected(parentTab?.id);

  const value = useMemo(
    () => ({
      tab,
      record,
      parentTab,
      parentRecord,
    }),
    [parentRecord, parentTab, record, tab],
  );

  return (
    <TabContext.Provider value={value}>
      <ToolbarProvider>
        <SearchProvider>{children}</SearchProvider>
      </ToolbarProvider>
    </TabContext.Provider>
  );
}

export const useTabContext = () => {
  const context = useContext(TabContext);

  if (!context) {
    throw new Error('useTabContext must be used within a TabContextProvider');
  }

  return context;
};
