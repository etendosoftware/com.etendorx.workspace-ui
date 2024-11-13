'use client';

import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { styles } from '../[recordId]/styles';

export default function NewRecordPage() {
  const { windowId, tabId } = useParams<{
    windowId: string;
    tabId: string;
  }>();

  const { windowData, tab } = useMetadataContext();

  const emptyRecord = {
    id: 'new',
  };

  if (!windowData || !tab) {
    return <span>Missing window metadata</span>;
  }

  return (
    <>
      <div style={styles.box}>
        <Toolbar windowId={windowId} tabId={tabId} />
      </div>
      <DynamicFormView windowData={windowData} tab={tab} record={emptyRecord} />
    </>
  );
}
