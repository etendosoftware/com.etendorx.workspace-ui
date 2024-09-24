/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useMemo, useState } from 'react';
import {
  type Etendo,
  Metadata,
} from '@workspaceui/etendohookbinder/src/api/metadata';
import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { buildColumnsData, groupTabsByLevel } from '../utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

interface IMetadataContext {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  windowData?: Etendo.WindowMetadata;
  columnsData?: Record<number, Record<string, Etendo.Column[]>>;
  selectRecord: (record: Record<string, any>, tab: Tab) => void;
  selectedTab: Record<string, Tab>;
  selected: Record<string, Record<string, any>>;
}

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({
  children,
}: React.PropsWithChildren) {
  const { windowId = '', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(windowId);
  const [selected, setSelected] = useState<IMetadataContext['selected']>({});
  const [selectedTab, setSelectedTab] = useState<
    IMetadataContext['selectedTab']
  >({});

  const selectRecord: IMetadataContext['selectRecord'] = useCallback(
    (record, tab) => {
      const level = tab.level;

      setSelected(prev => ({ ...prev, [level]: record }));
      setSelectedTab(prev => ({ ...prev, [level]: tab }));
    },
    [],
  );

  const groupedTabs = useMemo(() => groupTabsByLevel(windowData), [windowData]);
  const columnsData = useMemo(() => buildColumnsData(windowData), [windowData]);

  const value = useMemo(
    () => ({
      getWindow: Metadata.getWindow,
      getColumns: Metadata.getColumns,
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      windowData,
      columnsData,
      selectRecord,
      selected,
      selectedTab,
    }),
    [
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      windowData,
      columnsData,
      selectRecord,
      selected,
      selectedTab,
    ],
  );

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}
