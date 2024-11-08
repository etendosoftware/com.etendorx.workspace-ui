'use client';

import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';

export default function Page() {
  const { windowId, tabId, recordId } = useParams<{
    windowId: string;
    tabId: string;
    recordId: string;
  }>();

  const { windowData, tab } = useMetadataContext();
  const { record } = useSingleDatasource(tab?.entityName, recordId);

  if (!record) {
    return <span>Missing record</span>;
  } else if (!windowData || !tab) {
    return <span>Missing window metadata</span>;
  } else {
    return (
      <>
        <Toolbar windowId={windowId} tabId={tabId} />
        <DynamicFormView windowData={windowData} tab={tab} record={record} />
      </>
    );
  }
}
