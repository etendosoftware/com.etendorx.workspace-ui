import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import { ensureString } from '@workspaceui/componentlibrary/src/helpers/ensureString';
import { LABELS } from '@workspaceui/componentlibrary/src/components/Table/tableConstants';
import { Organization } from '@workspaceui/storybook/stories/Components/Table/types';

interface RecordContextType {
  selectedRecord: Organization | null;
  setSelectedRecord: (record: Organization | null) => void;
  getFormattedRecord: (
    record: Organization | null,
  ) => { identifier: string; type: string } | null;
}

export const RecordContext = createContext<RecordContextType | undefined>(
  undefined,
);

export function RecordProvider({ children }: React.PropsWithChildren) {
  const [selectedRecord, setSelectedRecord] = useState<Organization | null>(
    null,
  );

  const getFormattedRecord = useCallback((record: Organization | null) => {
    if (!record) return null;
    return {
      identifier:
        ensureString(record.documentNo?.value) || LABELS.NO_IDENTIFIER,
      type: ensureString(record.transactionDocument?.value) || LABELS.NO_TYPE,
    };
  }, []);

  const value = useMemo(
    () => ({
      selectedRecord,
      setSelectedRecord,
      getFormattedRecord,
    }),
    [selectedRecord, getFormattedRecord],
  );

  return (
    <RecordContext.Provider value={value}>{children}</RecordContext.Provider>
  );
}

export function useRecordContext(): RecordContextType {
  const context = useContext(RecordContext);
  if (context === undefined) {
    throw new Error('useRecordContext Error');
  }
  return context;
}

const RecordContextExports = {
  RecordProvider,
  useRecordContext,
  RecordContext,
};
export default RecordContextExports;
