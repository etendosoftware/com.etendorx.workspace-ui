'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { useMetadataContext } from '../hooks/useMetadataContext';
import TabContextProvider from '@/contexts/tab';
import FormView from './Form/FormView';
import { FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { useQueryParams } from '@/hooks/useQueryParams';

export function TabLevel({ tab, collapsed }: TabLevelProps) {
  const { window: windowMetadata } = useMetadataContext();
  const params = useQueryParams();
  const recordId = params['recordId_' + tab.id] ? String(params['recordId_' + tab.id]) : null;

  return (
    <TabContextProvider tab={tab}>
      <div
        className={`flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 ${collapsed ? 'hidden' : 'flex-1 h-full'}`}>
        <Toolbar windowId={tab.windowId} tabId={tab.id} isFormView={!!recordId} />
        {recordId ? (
          <FormView
            mode={recordId === 'new' ? FormMode.NEW : FormMode.EDIT}
            tab={tab}
            window={windowMetadata}
            recordId={recordId}
          />
        ) : (
          <DynamicTable tab={tab} window={windowMetadata} />
        )}
      </div>
    </TabContextProvider>
  );
}
