/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useState, useMemo, useCallback, useContext } from 'react';
import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useSetSession } from '@/hooks/useSetSession';
import { useSearchParams } from 'next/navigation';

type RecordContext = {
  selected: Record<string, EntityData>;
  selectedMultiple: Record<string, Record<string, EntityData>>;
  select: (record: EntityData, tab: Tab) => void;
  clear: (tab: Tab) => void;
  selectMultiple: (records: Record<string, EntityData>, tab: Tab) => void;
  clearMultiple: (tab: Tab) => void;
};

const Context = createContext<RecordContext>({
  selected: {},
  selectedMultiple: {},
  select: (_record: EntityData, _tab: Tab) => {},
  clear: (_tab: Tab) => {},
  selectMultiple: (_records: Record<string, EntityData>, _tab: Tab) => {},
  clearMultiple: (_tab: Tab) => {},
});

export default function SelectedProvider({ children }: React.PropsWithChildren) {
  // Used to store the "most recent" selected record in a given tab
  const [selected, setSelected] = useState<Record<string, EntityData>>({});
  // Used to store the selected records in a given tab
  const [selectedMultiple, setSelectedMultiple] = useState<Record<string, Record<string, EntityData>>>({});
  const searchParams = useSearchParams();
  const setSession = useSetSession();

  const select = useCallback(
    (record: EntityData, tab: Tab) => {
      setSelected(prev => ({ ...prev, [tab.id]: record }));
      setSession(record, tab);
      const params = new URLSearchParams(searchParams);
      params.set('selected_' + tab.id, String(record.id));
      window.history.pushState(null, '', `?${params}`);
    },
    [searchParams, setSession],
  );

  const clear = useCallback((tab: Tab) => {
    setSelected(prev => {
      const result = { ...prev };
      delete result[tab.id];

      return result;
    });
  }, []);

  const selectMultiple = useCallback((records: Record<string, EntityData>, tab: Tab) => {
    setSelectedMultiple(prev => ({ ...prev, [tab.id]: records }));
  }, []);

  const clearMultiple = useCallback((tab: Tab) => {
    setSelectedMultiple(prev => ({ ...prev, [tab.id]: {} }));
  }, []);

  const value = useMemo(
    () => ({
      selected,
      selectedMultiple,
      select,
      clear,
      selectMultiple,
      clearMultiple,
    }),
    [clear, clearMultiple, selectedMultiple, select, selectMultiple, selected],
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
