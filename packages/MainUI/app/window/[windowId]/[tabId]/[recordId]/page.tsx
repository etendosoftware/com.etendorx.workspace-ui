'use client';

import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';
import { styles } from './styles';
import { WindowParams } from '../../../../types';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { useTranslation } from '../../../../../hooks/useTranslation';

export default function Page() {
  const { windowId, tabId, recordId } = useParams<WindowParams>();
  const { t } = useTranslation();
  const { windowData, tab } = useMetadataContext();
  const { record } = useSingleDatasource(tab?.entityName, recordId);

  if (!record) {
    return (
      <ErrorDisplay
        title={t('errors.missingRecord.title')}
        description={t('errors.missingRecord.description')}
        showHomeButton
      />
    );
  }

  if (!windowData || !tab) {
    return (
      <ErrorDisplay
        title={t('errors.missingMetadata.title')}
        description={t('errors.missingMetadata.description')}
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
