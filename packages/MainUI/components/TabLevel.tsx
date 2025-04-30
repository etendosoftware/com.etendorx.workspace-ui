'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { SearchProvider } from '../contexts/searchContext';
import ResizableTabContainer from './Table/TabNavigation';
import { useMetadataContext } from '../hooks/useMetadataContext';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import TabContextProvider from '@/contexts/tab';
import { ToolbarProvider } from '@/contexts/ToolbarContext';
import { useSelected } from '@/contexts/selected';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const { window } = useMetadataContext();
  const { selected } = useSelected();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId') || '';
  const selectedRecord = useMemo(() => (tab ? selected[tab.level] : undefined), [selected, tab]);

  return (
    <ToolbarProvider>
      <TabContextProvider tab={tab}>
        <SearchProvider>
          <div className={`tab-level-${tab.level} flex flex-col min-h-0 flex-auto mx-1 max-h-full`}>
            <div className="mb-2 ">
              <Toolbar windowId={tab.windowId} tabId={tab.id} isFormView={Boolean(recordId)} />
            </div>
            <DynamicTable window={window} tab={tab} />
          </div>
          {selectedRecord && (
            <ResizableTabContainer
              isOpen
              onClose={() => {}}
              selectedRecord={selectedRecord}
              tab={tab}
              windowId={tab.windowId}
              isMainTab={false}
            />
          )}
        </SearchProvider>
      </TabContextProvider>
    </ToolbarProvider>
  );
}
