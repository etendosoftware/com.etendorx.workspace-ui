'use client';

import { useState, useMemo, useCallback } from 'react';
import { ensureString } from '@workspaceui/componentlibrary/src/helpers/ensureString';
import translations from '@workspaceui/componentlibrary/src/locales';
import { createContext } from 'react';
import { Organization } from '../../storybook/src/stories/Components/Table/types';

export interface RecordContextType {
  selectedRecord: Organization | null;
  setSelectedRecord: (record: Organization | null) => void;
  getFormattedRecord: (record: Organization | null) => { identifier: string; type: string } | null;
}

export const RecordContext = createContext({} as RecordContextType);

export function RecordProvider({ children }: React.PropsWithChildren) {
  const [selectedRecord, setSelectedRecord] = useState<Organization | null>(null);

  const getFormattedRecord: RecordContextType['getFormattedRecord'] = useCallback((record: Organization | null) => {
    if (!record) return null;
    return {
      identifier: ensureString(record.documentNo?.value) || translations.es.table.labels.noIdentifier,
      type: ensureString(record.transactionDocument?.value) || translations.es.table.labels.noType,
    };
  }, []);

  const value: RecordContextType = useMemo(
    () => ({
      selectedRecord,
      setSelectedRecord,
      getFormattedRecord,
    }),
    [getFormattedRecord, selectedRecord],
  );

  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}
