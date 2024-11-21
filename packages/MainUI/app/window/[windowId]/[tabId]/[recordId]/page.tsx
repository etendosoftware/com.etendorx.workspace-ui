'use client';

import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';
import { styles } from './styles';
import { WindowParams } from '../../../../types';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { useTranslation } from '../../../../../hooks/useTranslation';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';

export default function Page() {
  const { windowId, tabId, recordId } = useParams<WindowParams>();
  const { t } = useTranslation();

  const { windowData, tab, loading: metadataLoading } = useMetadataContext();
  const { record, loading: recordLoading, loaded, error } = useSingleDatasource(tab?.entityName, recordId);

  if ((metadataLoading || recordLoading) && !error && !loaded) {
    return <Spinner />;
  }

  if (!windowData || !tab || !record) {
    const isRecordMissing = loaded && !record;
    return (
      <ErrorDisplay
        title={isRecordMissing ? t('errors.missingRecord.title') : t('errors.missingMetadata.title')}
        description={isRecordMissing ? t('errors.missingRecord.description') : t('errors.missingMetadata.description')}
        showHomeButton
      />
    );
  }

  return (
    <>
      <div style={styles.box}>
        <Toolbar windowId={windowId} tabId={tabId} />
      </div>
      <DynamicFormView tab={tab} record={record} />
    </>
  );
}
