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
  windowData: undefined,
} as {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  windowData: Etendo.WindowMetadata | undefined;
};

export const MetadataContext = createContext(initialState);

export default function MetadataProvider({
  children,
  token,
}: React.PropsWithChildren<{ token?: string }>) {
  const { id = '143', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(id);

  const groupedTabs = useMemo(() => {
    const tabs: Record<string, Etendo.Tab[]> = {};

    windowData?.tabs.forEach(tab => {
      if (tabs[tab.level]) {
        tabs[tab.level].push(tab);
      } else {
        tabs[tab.level] = [tab];
      }
    });

    return Object.keys(tabs)
      .sort()
      .map(k => tabs[k]);
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
      windowData,
    }),
    [error, groupedTabs, id, loading, recordId, windowData],
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
