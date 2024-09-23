import { createContext, useEffect, useMemo } from 'react';
import {
  Etendo,
  Metadata,
} from '@workspaceui/etendohookbinder/src/api/metadata';
import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { buildColumnsData, groupTabsByLevel } from '../utils/metadata';

const initialState = {
  getWindow: Metadata.getWindow,
  getColumns: Metadata.getColumns,
  windowId: '',
  recordId: '',
  loading: false,
  error: undefined,
  groupedTabs: [],
  windowData: {} as Etendo.WindowMetadata,
  columnsData: {},
} as {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  windowData: Etendo.WindowMetadata;
  columnsData: Record<number, Record<string, Etendo.Column[]>>;
};

export const MetadataContext = createContext(initialState);

export default function MetadataProvider({
  children,
  token,
}: React.PropsWithChildren<{ token?: string }>) {
  const { id = '', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(id);

  const groupedTabs = useMemo(() => groupTabsByLevel(windowData), [windowData]);
  const columnsData = useMemo(() => buildColumnsData(windowData), [windowData]);

  const value = useMemo(
    () => ({
      getWindow: Metadata.getWindow,
      getColumns: Metadata.getColumns,
      windowId: id,
      recordId,
      loading,
      error,
      groupedTabs,
      windowData: windowData ?? initialState.windowData,
      columnsData,
    }),
    [error, groupedTabs, id, loading, recordId, windowData, columnsData],
  );

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}
