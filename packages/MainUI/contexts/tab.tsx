import { createContext, useContext, useMemo } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useTab } from '@/hooks/useTab';
import { ToolbarProvider } from './ToolbarContext';
import { SearchProvider } from './searchContext';
import useSelectedParentRecord from '@/hooks/useSelectedParentRecord';

interface TabContextI {
  tab: Tab;
  parentTab?: Tab | null;
  parentRecord?: EntityData | null;
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const { data: parentTab } = useTab(tab.parentTabId);
  const parentRecord = useSelectedParentRecord(tab);

  const value = useMemo(
    () => ({
      tab,
      parentTab,
      parentRecord,
    }),
    [parentRecord, parentTab, tab],
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
