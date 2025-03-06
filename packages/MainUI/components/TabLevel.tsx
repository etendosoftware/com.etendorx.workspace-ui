'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { SearchProvider } from '../contexts/searchContext';
import ResizableTabContainer from './Table/TabNavigation';
import { useMetadataContext } from '../hooks/useMetadataContext';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const { showTabContainer, setShowTabContainer, selected } = useMetadataContext();

  const selectedRecord = tab ? selected[tab.level] : undefined;

  const formattedSelectedRecord = selectedRecord
    ? {
        identifier: selectedRecord._identifier || String(selectedRecord.id) || '',
        type: tab?.title || '',
        ...selectedRecord,
      }
    : null;

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
      {showTabContainer && formattedSelectedRecord && (
        <ResizableTabContainer
          isOpen={showTabContainer}
          onClose={() => setShowTabContainer(false)}
          selectedRecord={formattedSelectedRecord}
          tab={tab}
          windowId={tab.windowId}
          onHeightChange={() => {}}
        />
      )}
    </SearchProvider>
  );
}
