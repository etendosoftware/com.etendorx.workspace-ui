'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import {
  getFieldsByDBColumnName,
  getFieldsByName,
  groupTabsByLevel,
} from '@workspaceui/etendohookbinder/src/utils/metadata';
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
  selectedMultiple: Record<string, Record<string, boolean>>;
  selectMultiple: (recordIds: string[], tab: Tab, replace?: boolean) => void;
  isSelected: (recordId: string, tabId: string) => boolean;
  clearSelections: (tabId: string) => void;
  getSelectedCount: (tabId: string) => number;
  getSelectedIds: (tabId: string) => string[];
  tabs: Tab[];
  tab?: Tab;
  columns?: Record<string, Field>;
  fieldsByColumnName: Record<string, Field>;
  fieldsByInputName: Record<string, Field>;
  showTabContainer: boolean;
  setShowTabContainer: (value: boolean | ((prev: boolean) => boolean)) => void;
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
  const [selectedMultiple, setSelectedMultiple] = useState<Record<string, Record<string, boolean>>>({});
  const [showTabContainer, setShowTabContainer] = useState(false);

  const isSelected = useCallback(
    (recordId: string, tabId: string) => {
      return !!selectedMultiple[tabId]?.[recordId];
    },
    [selectedMultiple],
  );

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

  const selectMultiple = useCallback(
    (recordIds: string[], tab: Tab, replace: boolean = false) => {
      const tabId = tab.id;

      setSelectedMultiple(prev => {
        const currentTabSelections = replace ? {} : prev[tabId] || {};

        const updatedSelections = { ...currentTabSelections };

        recordIds.forEach(id => {
          updatedSelections[id] = true;
        });

        return {
          ...prev,
          [tabId]: updatedSelections,
        };
      });

      if (recordIds.length === 1) {
        const recordId = recordIds[0];
        const record = windowData?.tabs.find(t => t.id === tab.id)?.records?.[recordId] as
          | Record<string, never>
          | undefined;

        if (record) {
          selectRecord(record, tab);
        }
      }
    },
    [windowData?.tabs, selectRecord],
  );

  const clearSelections = useCallback((tabId: string) => {
    setSelectedMultiple(prev => ({
      ...prev,
      [tabId]: {},
    }));
  }, []);

  const getSelectedCount = useCallback(
    (tabId: string) => {
      const selections = selectedMultiple[tabId] || {};
      return Object.values(selections).filter(Boolean).length;
    },
    [selectedMultiple],
  );

  const getSelectedIds = useCallback(
    (tabId: string) => {
      const selections = selectedMultiple[tabId] || {};
      return Object.entries(selections)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);
    },
    [selectedMultiple],
  );

  useEffect(() => {
    setSelectedMultiple({});
  }, [windowId]);

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

  useEffect(() => {
    loadWindowData();
  }, [loadWindowData]);

  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);
  const fieldsByColumnName = useMemo(() => (tab ? getFieldsByDBColumnName(tab) : {}), [tab]);
  const fieldsByInputName = useMemo(() => (tab ? getFieldsByName(tab) : {}), [tab]);

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
      fieldsByColumnName,
      fieldsByInputName,
      selectedMultiple,
      selectMultiple,
      isSelected,
      clearSelections,
      getSelectedCount,
      getSelectedIds,
      showTabContainer,
      setShowTabContainer,
    }),
    [
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
      fieldsByColumnName,
      fieldsByInputName,
      selectedMultiple,
      selectMultiple,
      isSelected,
      clearSelections,
      getSelectedCount,
      getSelectedIds,
      showTabContainer,
      setShowTabContainer,
    ],
  );

  useEffect(() => {
    setSelected({});
  }, [windowId]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
