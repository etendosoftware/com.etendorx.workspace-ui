'use client';

import { Toolbar } from '../Toolbar/Toolbar';
import DynamicTable from '../Table';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import TabContextProvider from '@/contexts/tab';
import { FormView } from '@/components/Form/FormView';
import { FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { useQueryParams } from '@/hooks/useQueryParams';
import { TabLevelProps } from '@/components/window/types';

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const params = useQueryParams();
  const recordId = params['recordId_' + tab.id] ? String(params['recordId_' + tab.id]) : null;

  return (
    <TabContextProvider tab={tab}>
      <div
        className={`flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${collapsed ? 'hidden' : 'flex-1 h-full'}`}>
        <Toolbar windowId={window?.id || tab.window} tabId={tab.id} isFormView={!!recordId} />
        {recordId ? (
          <FormView
            mode={recordId === 'new' ? FormMode.NEW : FormMode.EDIT}
            tab={tab}
            window={window}
            recordId={recordId}
          />
        ) : (
          <DynamicTable />
        )}
      </div>
    </TabContextProvider>
  );
}

export default Tab;
