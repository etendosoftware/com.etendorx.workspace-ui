'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { groupTabsByLevel } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useParams } from 'next/navigation';
import { WindowParams } from '../app/types';
import { IMetadataContext } from './types';
import { useDatasourceContext } from './datasourceContext';
import { useSetSession } from '@/hooks/useSetSession';

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({ children }: React.PropsWithChildren) {
  const { windowId = '', tabId = '', recordId = '' } = useParams<WindowParams>();
  const [windowData, setWindowData] = useState<Etendo.WindowMetadata | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [selected, setSelected] = useState<IMetadataContext['selected']>({});
  const [groupedTabs, setGroupedTabs] = useState<Etendo.Tab[][]>([]);
  const [selectedMultiple, setSelectedMultiple] = useState<IMetadataContext['selectedMultiple']>({});
  const [showTabContainer, setShowTabContainer] = useState(false);
  const [activeTabLevels, setActiveTabLevels] = useState<number[]>([0]);
  const tab = useMemo(() => windowData?.tabs?.find(t => t.id === tabId), [tabId, windowData?.tabs]);
  const tabs = useMemo<Tab[]>(() => windowData?.tabs ?? [], [windowData]);
  const { removeRecordFromDatasource } = useDatasourceContext();

  const closeTab = useCallback(
    (level: number) => {
      if (level <= 0) {
        return;
      }

      setActiveTabLevels(prev => {
        const newLevels = prev.filter(l => l < level);
        return newLevels;
      });

      const tabsToUpdate = tabs.filter(t => t.level >= level);

      tabsToUpdate.forEach(tab => {
        const tabLevel = tab.level;
        const recordToDeselect = selected[tabLevel];

        if (recordToDeselect) {
          setSelectedMultiple(prev => {
            const updatedSelections = { ...prev };

            if (updatedSelections[tab.id]) {
              const newTabSelections = { ...updatedSelections[tab.id] };
              delete newTabSelections[String(recordToDeselect.id)];
              updatedSelections[tab.id] = newTabSelections;
            }

            return updatedSelections;
          });
        }
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
    [setActiveTabLevels, setShowTabContainer, setSelected, setSelectedMultiple, selected, tabs],
  );

  const isSelected = useCallback(
    (recordId: string, tabId: string) => {
      return !!selectedMultiple[tabId]?.[recordId];
    },
    [selectedMultiple],
  );

  const setSession = useSetSession();

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

      setSession(record, tab);

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
    [groupedTabs, selected, setSession],
  );

  const selectMultiple = useCallback((records: Record<string, unknown>[], tab: Tab) => {
    let last;

    setSelectedMultiple(prev => {
      const result = { ...prev };

      result[tab.id] = {};
      records.forEach(record => {
        last = record;
        result[tab.id][record.id as string] = record;
      });

      return result;
    });

    if (last) {
      selectRecord(last, tab)
    }
  }, [selectRecord]);

  const clearSelections = useCallback(
    (tabId: string) => {
      setSelectedMultiple(prev => ({
        ...prev,
        [tabId]: {},
      }));
      const tabLevel = tabs.find(t => t.id === tabId)?.level;

      if (tabLevel !== undefined) {
        setSelected(prev => {
          const newSelections = { ...prev };
          delete newSelections[tabLevel];

          Object.keys(newSelections).forEach(strLevel => {
            if (parseInt(strLevel) > tabLevel) {
              delete newSelections[strLevel];
            }
          });

          return newSelections;
        });
      }
    },
    [tabs],
  );

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
    setSelected({});
    setSelectedMultiple({});
    setActiveTabLevels([0]);
    setShowTabContainer(false);
  }, [windowId]);

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

  const removeRecord = useCallback(
    (tabId: string, recordId: string) => {
      setWindowData(prevWindowData => {
        if (!prevWindowData) return prevWindowData;

        const updatedTabs = prevWindowData.tabs.map(tab => {
          if (tab.id === tabId) {
            const updatedRecords = { ...tab.records };
            delete updatedRecords[recordId];

            return {
              ...tab,
              records: updatedRecords,
            };
          }
          return tab;
        });

        return {
          ...prevWindowData,
          tabs: updatedTabs,
        };
      });

      setSelectedMultiple(prev => {
        const updatedSelections = { ...prev };
        if (updatedSelections[tabId]) {
          const newTabSelections = { ...updatedSelections[tabId] };
          delete newTabSelections[recordId];
          updatedSelections[tabId] = newTabSelections;
        }
        return updatedSelections;
      });

      setSelected(prev => {
        const newSelections = { ...prev };
        const tabLevel = tabs.find(t => t.id === tabId)?.level;

        if (tabLevel !== undefined && newSelections[tabLevel] && newSelections[tabLevel].id === recordId) {
          delete newSelections[tabLevel];

          Object.keys(newSelections).forEach(strLevel => {
            if (parseInt(strLevel) > tabLevel) {
              delete newSelections[strLevel];
            }
          });
        }

        return newSelections;
      });

      removeRecordFromDatasource(tabId, recordId);
    },
    [tabs, removeRecordFromDatasource],
  );

  const value = useMemo<IMetadataContext>(
    () => ({
      getWindow: Metadata.getWindow,
      getColumns: Metadata.getColumns,
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      window: windowData,
      selectRecord,
      selected,
      tabs,
      tab,
      selectedMultiple,
      setSelectedMultiple,
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
      refetch: loadWindowData,
      removeRecord,
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
      selectedMultiple,
      selectMultiple,
      isSelected,
      clearSelections,
      getSelectedCount,
      getSelectedIds,
      showTabContainer,
      activeTabLevels,
      closeTab,
      loadWindowData,
      removeRecord,
    ],
  );

  useEffect(() => {
    setSelected({});
    setActiveTabLevels([0]);
    setShowTabContainer(false);
  }, [windowId]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}
