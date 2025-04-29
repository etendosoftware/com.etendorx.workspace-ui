'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { groupTabsByLevel } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useParams } from 'next/navigation';
import { WindowParams } from '../app/types';
import { IMetadataContext } from './types';
import { useDatasourceContext } from './datasourceContext';

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const { windowId = '', tabId = '', recordId = '' } = useParams<WindowParams>();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [groupedTabs, setGroupedTabs] = useState<Etendo.Tab[][]>([]);
  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);
  const { removeRecordFromDatasource } = useDatasourceContext();

  const loadWindowData = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(undefined);

      Metadata.clearWindowCache(windowId);
      const newWindowData = await Metadata.forceWindowReload(windowId);

      setWindowData(newWindowData);
      setGroupedTabs(groupTabsByLevel(newWindowData));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId]);

  const removeRecord = useCallback(
    (tabId: string, recordId: string) => {
      removeRecordFromDatasource(tabId, recordId);
    },
    [removeRecordFromDatasource],
  );

  const value = useMemo(
    () => ({
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      window: windowData,
      tabs,
      tab,
      refetch: loadWindowData,
      removeRecord,
    }),
    [error, groupedTabs, loadWindowData, loading, recordId, removeRecord, tab, tabs, windowData, windowId],
  );

  useEffect(() => {
    loadWindowData();
  }, [loadWindowData]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
