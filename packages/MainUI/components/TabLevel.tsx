'use client';

import { Toolbar } from './Toolbar/Toolbar';
import DynamicTable from './Table';
import { TabLevelProps } from './types';
import { useMetadataContext } from '../hooks/useMetadataContext';
import TabContextProvider from '@/contexts/tab';
import FormView from './Form/FormView';
import { FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { useQueryParams } from '@/hooks/useQueryParams';

export function TabLevel({ tab }: Omit<TabLevelProps, 'level'>) {
  const { window } = useMetadataContext()
  const params = useQueryParams();
  const recordId = params["recordId_" + tab.id] ? String(params["recordId_" + tab.id]) : null;

  return (
    <TabContextProvider tab={tab}>
      <div className={`flex flex-1 max-w-auto max-h-auto gap-2 p-2 flex-col min-h-0 ${tab.level === 0 ? "" : "bg-white rounded-xl"}`}>
        <Toolbar windowId={tab.windowId} tabId={tab.id} isFormView={Boolean(recordId)} />
        {recordId ? (
          <FormView
            mode={recordId === 'new' ? FormMode.NEW : FormMode.EDIT}
            tab={tab}
            window={window}
            recordId={recordId}
          />
        ) : (
          <DynamicTable tab={tab} window={window} />
        )}
      </div>
    </TabContextProvider>
  );
}
