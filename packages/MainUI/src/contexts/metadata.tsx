import { createContext, useEffect, useMemo } from 'react';
import {
  Etendo,
  Metadata,
} from '@workspaceui/etendohookbinder/src/api/metadata';
import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';

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

  const groupedTabs = useMemo(() => {
    if (!windowData) {
      return [];
    }

    const tabs: Etendo.Tab[][] = Array(windowData.tabs.length);

    windowData?.tabs.forEach(tab => {
      if (tabs[tab.level]) {
        tabs[tab.level].push(tab);
      } else {
        tabs[tab.level] = [tab];
      }
    });

    return tabs;
  }, [windowData]);

  const columnsData = useMemo(() => {
    const cols: Record<number, Record<string, Etendo.Column[]>> = {};

    if (windowData?.tabs?.length) {
      windowData.tabs.forEach(tab => {
        if (!cols[tab.level]) {
          cols[tab.level] = {};
        }

        cols[tab.level][tab.id] = Metadata.getColumns(tab.id);
      });
    }

    return cols;
  }, [windowData]);

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

  useEffect(() => {
    if (token) {
      Metadata.authorize(token);
      Metadata.initialize();
    }
  }, [token]);

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}
