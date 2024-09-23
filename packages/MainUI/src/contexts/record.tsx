import React, { useState, useMemo, useCallback } from 'react';
import { ensureString } from '@workspaceui/componentlibrary/src/helpers/ensureString';
import translations from '@workspaceui/componentlibrary/src/locales';
import { createContext } from 'react';
import { Organization } from '../../../storybook/src/stories/Components/Table/types';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export interface RecordContextType {
  selectedRecord: Organization | null;
  setSelectedRecord: (record: Organization | null) => void;
  getFormattedRecord: (
    record: Organization | null,
  ) => { identifier: string; type: string } | null;
  selectRecord: (record: any, tab: Tab) => void;
  selectedTab?: Tab;
  selected: any[];
}

export const RecordContext = createContext({} as RecordContextType);

export function RecordProvider({ children }: React.PropsWithChildren) {
  const [selectedRecord, setSelectedRecord] = useState<Organization | null>(
    null,
  );
  const [selected, setSelected] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab | undefined>();

  const selectRecord: RecordContextType['selectRecord'] = useCallback(
    (record, tab) => {
      const level = tab.level;

      if (selected.length >= level) {
        setSelected(prev => [...prev.slice(0, level), record]);
        setSelectedTab(tab);
      } else {
        throw new Error('Selected a level higher than the previous selected');
      }
    },
    [selected.length],
  );

  const getFormattedRecord: RecordContextType['getFormattedRecord'] =
    useCallback((record: Organization | null) => {
      if (!record) return null;
      return {
        identifier:
          ensureString(record.documentNo?.value) ||
          translations.es.table.labels.noIdentifier,
        type:
          ensureString(record.transactionDocument?.value) ||
          translations.es.table.labels.noType,
      };
    }, []);

  const value: RecordContextType = useMemo(
    () => ({
      selectedRecord,
      setSelectedRecord,
      getFormattedRecord,
      selectRecord,
      selected,
      selectedTab,
    }),
    [selectedRecord, getFormattedRecord, selectRecord, selected, selectedTab],
  );

  return (
    <RecordContext.Provider value={value}>{children}</RecordContext.Provider>
  );
}
