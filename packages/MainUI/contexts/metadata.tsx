'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/api/metadata';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { buildColumnsData, groupTabsByLevel } from '../utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/api/types';
import { useParams } from 'next/navigation';
import useFormRecord from '../hooks/useFormRecord';

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
  selectRecord: (record: Record<string, never>, tab: Tab) => void;
  selected: Record<string, Record<string, never>>;
  tabs: Tab[];
  tab?: Tab;
  record?: Record<string, unknown>;
}

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const {
    windowId = '',
    tabId = '',
    recordId = '',
  } = useParams<{ windowId: string; tabId: string; recordId: string }>();
  const { windowData, loading, error } = useWindow(windowId);
  const [selected, setSelected] = useState<IMetadataContext['selected']>({});

  const selectRecord: IMetadataContext['selectRecord'] = useCallback(
    (record, tab) => {
      const level = tab.level;
      const max = Object.keys(selected).reduce((max, strLevel) => {
        return Math.max(max, parseInt(strLevel));
      }, 0);

      setSelected(prev => {
        for (let index = max; index > level; index--) {
          delete prev[index];
        }

        return { ...prev, [level]: record };
      });
    },
    [selected],
  );

  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);
  const groupedTabs = useMemo(() => groupTabsByLevel(windowData), [windowData]);
  const columnsData = useMemo(() => buildColumnsData(windowData), [windowData]);
  const record = useFormRecord(tab?.entityName, recordId);

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
      tabs,
      tab,
      record,
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
      tabs,
      tab,
      record,
    ],
  );

  useEffect(() => {
    setSelected({});
  }, [windowId]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
