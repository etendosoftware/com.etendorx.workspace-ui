'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { SearchProvider } from '../contexts/searchContext';
import ResizableTabContainer from './Table/TabNavigation';
import { useMetadataContext } from '../hooks/useMetadataContext';
import { useCallback, useEffect, useMemo } from 'react';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const {
    showTabContainer,
    setShowTabContainer,
    selected,
    tabs,
    activeTabLevels,
    setActiveTabLevels,
    groupedTabs,
    closeTab,
  } = useMetadataContext();

  const selectedRecord = useMemo(() => (tab ? selected[tab.level] : undefined), [selected, tab]);

  const childLevel = tab.level + 1;

  const childTabs = useMemo(
    () => groupedTabs.find(tabs => tabs[0]?.level === childLevel) || [],
    [childLevel, groupedTabs],
  );

  const hasChildTabs = childTabs.length > 0;

  const childTab = useMemo(() => tabs.find(t => t.level === childLevel), [childLevel, tabs]);
  const isChildTabActive = useMemo(() => activeTabLevels.includes(childLevel), [activeTabLevels, childLevel]);

  const grandchildLevel = childLevel + 1;
  const isGrandchildActive = useMemo(
    () => activeTabLevels.includes(grandchildLevel),
    [activeTabLevels, grandchildLevel],
  );

  const hasGrandchildSelected = !!selected[childLevel];

  const isChildTabMain = tab.level === 0 && isGrandchildActive && hasGrandchildSelected;

  const formattedSelectedRecord = useMemo(() => {
    if (!selectedRecord) return null;
    return {
      identifier: selectedRecord._identifier || String(selectedRecord.id) || '',
      type: tab?.title || '',
      ...selectedRecord,
    };
  }, [selectedRecord, tab?.title]);

  const childSelectedRecord = useMemo(() => {
    if (!childTab || !selected[childLevel]) return null;
    return {
      identifier: selected[childLevel]._identifier || String(selected[childLevel].id) || '',
      type: childTab?.title || '',
      ...selected[childLevel],
    };
  }, [childTab, selected, childLevel]);

  useEffect(() => {
    if (tab.level === 0 && selectedRecord && hasChildTabs) {
      if (!activeTabLevels.includes(1)) {
        setActiveTabLevels(prev => [...prev.filter(l => l <= 0), 1]);
      }
      setShowTabContainer(true);
    }
  }, [selectedRecord, tab.level, activeTabLevels, setActiveTabLevels, hasChildTabs, setShowTabContainer]);

  const shouldShowChildContainer = useMemo(() => {
    return (
      tab.level === 0 &&
      showTabContainer &&
      formattedSelectedRecord &&
      hasChildTabs &&
      activeTabLevels.includes(childLevel)
    );
  }, [tab.level, showTabContainer, formattedSelectedRecord, hasChildTabs, activeTabLevels, childLevel]);

  const shouldShowGrandchildContainer = useMemo(() => {
    return (
      tab.level === 0 &&
      isChildTabActive &&
      childSelectedRecord &&
      childTab &&
      activeTabLevels.includes(grandchildLevel)
    );
  }, [tab.level, isChildTabActive, childSelectedRecord, childTab, activeTabLevels, grandchildLevel]);

  const handleCloseChildTab = useCallback(() => closeTab(childLevel), [childLevel, closeTab]);

  const handleCloseGrandchildTab = useCallback(() => closeTab(grandchildLevel), [closeTab, grandchildLevel]);

  return (
    <SearchProvider>
      <div className={`tab-level-${tab.level} h-full flex flex-col overflow-hidden`}>
        <div className="mb-2">
          <Toolbar windowId={tab.windowId} tabId={tab.id} />
        </div>
        <div className="flex-grow overflow-hidden">
          <DynamicTable tab={tab} />
        </div>
      </div>
      {shouldShowChildContainer && (
        <ResizableTabContainer
          isOpen={shouldShowChildContainer}
          onClose={handleCloseChildTab}
          selectedRecord={formattedSelectedRecord}
          tab={tab}
          windowId={tab.windowId}
          isMainTab={isChildTabMain}
        />
      )}
      {shouldShowGrandchildContainer && (
        <ResizableTabContainer
          isOpen={shouldShowGrandchildContainer}
          onClose={handleCloseGrandchildTab}
          selectedRecord={childSelectedRecord}
          tab={childTab}
          windowId={childTab?.windowId}
          isMainTab={false}
        />
      )}
    </SearchProvider>
  );
}
