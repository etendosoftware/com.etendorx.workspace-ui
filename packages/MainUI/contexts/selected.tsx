'use client';

import { createContext, useState, useMemo, useCallback, useContext } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { mapBy } from '@/utils/structures';

type RecordContext = {
  selected: Record<string, EntityData>;
  records: Record<string, Record<string, EntityData>>;
  select: (record: EntityData, tab: Tab) => void;
  clear: (tab: Tab) => void;
  selectMultiple: (records: EntityData[], tab: Tab) => void;
  clearMultiple: (tab: Tab) => void;
};

const Context = createContext<RecordContext>({
  selected: {},
  records: {},
  select: (_record: EntityData, _tab: Tab) => {},
  clear: (_tab: Tab) => {},
  selectMultiple: (_records: EntityData[], _tab: Tab) => {},
  clearMultiple: (_tab: Tab) => {},
});

export default function SelectedProvider({ children }: React.PropsWithChildren) {
  // Used to store the "most recent" selected record in a given tab
  const [selected, setSelected] = useState<Record<string, EntityData>>({});
  // Used to store the selected records in a given tab
  const [records, setRecords] = useState<Record<string, Record<string, EntityData>>>({});

  const select = useCallback((record: EntityData, tab: Tab) => {
    setSelected(prev => {
      if (prev[tab.id]?.id === record.id) {
        const result = { ...prev };
        delete result[tab.id];

        return result;
      } else {
        return { ...prev, [tab.id]: record }
      }
  });
  }, []);

  const clear = useCallback((tab: Tab) => {
    setSelected(prev => {
      const result = { ...prev };
      delete result[tab.id];

      return result;
    });
  }, []);

  const selectMultiple = useCallback((records: EntityData[], tab: Tab) => {
    setRecords(prev => ({ ...prev, [tab.id]: mapBy(records, 'id') }));
  }, []);

  const clearMultiple = useCallback((tab: Tab) => {
    setRecords(prev => ({ ...prev, [tab.id]: {} }));
  }, []);

  const value = useMemo(
    () => ({
      selected,
      records,
      select,
      clear,
      selectMultiple,
      clearMultiple,
    }),
    [clear, clearMultiple, records, select, selectMultiple, selected],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useSelected = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error('useSelected must be used inside of a SelectedProvider.');
  }

  return context;
};
