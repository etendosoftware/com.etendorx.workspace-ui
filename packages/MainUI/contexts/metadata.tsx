'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { groupTabsByLevel } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useParams } from 'next/navigation';
import { WindowParams } from '../app/types';
import { useLanguage } from '../hooks/useLanguage';

interface IMetadataContext {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  windowData?: Etendo.WindowMetadata;
  selectRecord: (record: Record<string, never>, tab: Tab) => void;
  selected: Record<string, Record<string, never>>;
  tabs: Tab[];
  tab?: Tab;
  columns?: Record<string, Field>;
}

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const { windowId = '', tabId = '', recordId = '' } = useParams<WindowParams>();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [selected, setSelected] = useState<IMetadataContext['selected']>({});
  const [groupedTabs, setGroupedTabs] = useState<Etendo.Tab[][]>([]);
  const { language } = useLanguage();

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

  const loadWindowData = useCallback(async () => {
    if (!windowId) return;

    try {
      setLoading(true);
      setError(undefined);

      Metadata.setLanguage(language);
      Metadata.clearWindowCache(windowId);
      const newWindowData = await Metadata.forceWindowReload(windowId);

      setWindowData(newWindowData);
      setGroupedTabs(groupTabsByLevel(newWindowData));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [windowId, language]);

  // Efecto para cargar datos iniciales y cuando cambia el idioma
  useEffect(() => {
    loadWindowData();
  }, [loadWindowData]);

  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);

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
      selectRecord,
      selected,
      tabs,
      tab,
    }),
    [windowId, recordId, loading, error, groupedTabs, windowData, selectRecord, selected, tabs, tab],
  );

  useEffect(() => {
    setSelected({});
  }, [windowId]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
