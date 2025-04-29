'use client';

import { createContext, useState, useMemo, useCallback, useContext } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { mapBy } from '@/utils/structures';

type RecordContext = {
  record: Record<string, EntityData>;
  records: Record<string, Record<string, EntityData>>;
  select: (record: EntityData, tab: Tab) => void;
  clear: (tab: Tab) => void;
  selectMultiple: (records: EntityData[], tab: Tab) => void;
  clearMultiple: (tab: Tab) => void;
};

const Context = createContext<RecordContext>({
  record: {},
  records: {},
  select: (_record: EntityData, _tab: Tab) => {},
  clear: (_tab: Tab) => {},
  selectMultiple: (_records: EntityData[], _tab: Tab) => {},
  clearMultiple: (_tab: Tab) => {},
});

export default function SelectedProvider({ children }: React.PropsWithChildren) {
  // Used to store the "most recent" selected record in a given tab
  const [record, setRecord] = useState<Record<string, EntityData>>({});
  // Used to store the selected records in a given tab
  const [records, setRecords] = useState<Record<string, Record<string, EntityData>>>({});

  const select = useCallback((record: EntityData, tab: Tab) => {
    setRecord(prev => ({ ...prev, [tab.id]: record }));
  }, []);

  const clear = useCallback((tab: Tab) => {
    setRecord(prev => {
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
      record,
      records,
      select,
      clear,
      selectMultiple,
      clearMultiple,
    }),
    [record, records, select, clear, selectMultiple, clearMultiple],
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
