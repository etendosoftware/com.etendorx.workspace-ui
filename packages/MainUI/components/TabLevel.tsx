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
  const { window } = useMetadataContext();
  const { recordId } = useQueryParams<{ recordId: string }>();

  return (
    <TabContextProvider tab={tab}>
      <div className="flex gap-2 p-2 flex-col min-h-0" style={{ zIndex: (tab.level + 1) * 100 }}>
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
