'use client';

import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { adaptInitialData } from '../../../../../utils/AdaptInitialData';
import { styles } from '../[recordId]/styles';
import { useFormInitialization } from '../../../../../hooks/useFormInitialValues';

export default function NewRecordPage() {
  const { windowId, tabId } = useParams<{
    windowId: string;
    tabId: string;
  }>();

  const { windowData, tab } = useMetadataContext();
  const { initialData, loading, error } = useFormInitialization(tabId);

  if (loading) {
    return <span>Loading form data...</span>;
  }

  if (error) {
    return <span>Error loading form data: {error.message}</span>;
  }

  if (!windowData || !tab || !initialData) {
    return <span>Missing required data</span>;
  }

  const record = Object.entries(initialData.columnValues).reduce((acc, [key, value]) => {
    acc[key] = value.value;
    if (value.identifier) {
      acc[`${key}$_identifier`] = value.identifier;
    }
    return acc;
  }, {} as Record<string, any>);

  const adaptedData = adaptInitialData(tab, record);

  if (!adaptedData) {
    return <span>Error adapting form data</span>;
  }

  console.log('initial data:', initialData, 'record:', record);

  return (
    <>
      <div style={styles.box}>
        <Toolbar windowId={windowId} tabId={tabId} />
      </div>
      <DynamicFormView windowData={windowData} tab={tab} record={record} />
    </>
  );
}
