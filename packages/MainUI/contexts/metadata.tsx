'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import {
  getFieldsByDBColumnName,
  getFieldsByName,
  groupTabsByLevel,
} from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useParams } from 'next/navigation';
import { WindowParams } from '../app/types';
import { useLanguage } from '../hooks/useLanguage';
import { IMetadataContext } from './types';

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
  const [activeTabLevels, setActiveTabLevels] = useState<number[]>([0]);
  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);
  const fieldsByColumnName = useMemo(() => (tab ? getFieldsByDBColumnName(tab) : {}), [tab]);
  const fieldsByInputName = useMemo(() => (tab ? getFieldsByName(tab) : {}), [tab]);

  const closeTab = useCallback(
    (level: number) => {
      if (level <= 0) {
        return;
      }

      setActiveTabLevels(prev => {
        const newLevels = prev.filter(l => l < level);
        return newLevels;
      });

      if (level === 1) {
        setShowTabContainer(false);
        setSelected({});
      }

      setSelected(prev => {
        const newSelections = { ...prev };
        Object.keys(newSelections).forEach(tabLevel => {
          if (parseInt(tabLevel) >= level) {
            delete newSelections[tabLevel];
          }
        });
        return newSelections;
      });
    },
    [setActiveTabLevels, setShowTabContainer, setSelected],
  );

  const isSelected = useCallback(
    (recordId: string, tabId: string) => {
      return !!selectedMultiple[tabId]?.[recordId];
    },
    [selectedMultiple],
  );

  const selectRecord: IMetadataContext['selectRecord'] = useCallback(
    (record, tab) => {
      const level = tab.level;

      const isDeselecting = selected[level] && selected[level].id === record.id;

      if (isDeselecting) {
        setSelected(prev => {
          const newSelections = { ...prev };
          Object.keys(newSelections).forEach(strLevel => {
            if (parseInt(strLevel) >= level) {
              delete newSelections[strLevel];
            }
          });
          return newSelections;
        });

        if (level === 0) {
          setShowTabContainer(false);
          setActiveTabLevels([0]);
        }

        return;
      }

      setSelected(prev => {
        const newSelections = { ...prev };
        Object.keys(newSelections).forEach(strLevel => {
          if (parseInt(strLevel) > level) {
            delete newSelections[strLevel];
          }
        });

        return { ...newSelections, [level]: record };
      });

      const nextLevel = level + 1;
      const hasNextLevelTabs = groupedTabs.some(tabs => tabs[0]?.level === nextLevel);

      if (hasNextLevelTabs) {
        const newLevels = [];
        for (let i = 0; i <= nextLevel; i++) {
          newLevels.push(i);
        }
        setActiveTabLevels(newLevels);

        if (level === 0) {
          setShowTabContainer(true);
        }
      }
    },
    [groupedTabs, selected],
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
    setSelected({}), setSelectedMultiple({});
    setActiveTabLevels([0]);
    setShowTabContainer(false);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const filteredLevels = activeTabLevels.filter(level => level > 0);
        if (filteredLevels.length > 0) {
          const highestLevel = Math.max(...filteredLevels);
          closeTab(highestLevel);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTabLevels, closeTab]);

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
      activeTabLevels,
      setActiveTabLevels,
      closeTab,
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
      activeTabLevels,
      setActiveTabLevels,
      closeTab,
    ],
  );

  useEffect(() => {
    setSelected({});
    setActiveTabLevels([0]);
    setShowTabContainer(false);
  }, [windowId]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
