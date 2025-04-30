import { createContext, useContext, useMemo, useState } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useTab } from '@/hooks/useTab';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import { useSearchParams } from 'next/navigation';

interface TabContextI {
  tab: Tab;
  parentTab?: Tab;
  parentRecord?: EntityData;
  selected: Record<string, EntityData>,
  setSelected: React.Dispatch<React.SetStateAction<Record<string, EntityData>>>
}

const TabContext = createContext<TabContextI>({} as TabContextI);

export default function TabContextProvider({ tab, children }: React.PropsWithChildren<{ tab: Tab }>) {
  const searchParams = useSearchParams();
  const { data: parentTab } = useTab(tab.parentTabId);
  const { record: parentRecord } = useSingleDatasource(parentTab?.entityName, searchParams.get('parentId'));
  const [selected, setSelected] = useState<Record<string, EntityData>>({});

  const value = useMemo(
    () => ({
      tab,
      parentTab,
      parentRecord,
      selected,
      setSelected,
    }),
    [parentRecord, parentTab, selected, tab],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export const useTabContext = () => {
  const context = useContext(TabContext);

  if (!context) {
    throw new Error('useTabContext must be used within a TabContextProvider');
  }

  return context;
};
