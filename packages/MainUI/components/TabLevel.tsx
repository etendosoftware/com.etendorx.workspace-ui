'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { SearchProvider } from '../contexts/searchContext';
import { useMetadataContext } from '../hooks/useMetadataContext';
import { useSearchParams } from 'next/navigation';

import TabContextProvider from '@/contexts/tab';
import { ToolbarProvider } from '@/contexts/ToolbarContext';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const { window } = useMetadataContext();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId') || '';

  return (
    <ToolbarProvider>
      <TabContextProvider tab={tab}>
        <SearchProvider>
          <div className="flex gap-2 p-2 flex-col min-h-0 flex-auto max-h-full">
            <Toolbar windowId={tab.windowId} tabId={tab.id} isFormView={Boolean(recordId)} />
            <DynamicTable window={window} tab={tab} />
          </div>
        </SearchProvider>
      </TabContextProvider>
    </ToolbarProvider>
  );
}
