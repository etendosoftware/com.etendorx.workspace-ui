'use client';

import { useCallback, useRef } from 'react';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useParams } from 'next/navigation';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar/Toolbar';
import { styles } from './styles';
import { WindowParams } from '../../../../types';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { useTranslation } from '../../../../../hooks/useTranslation';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { useFormInitialization } from '../../../../../hooks/useFormInitialValues';

export default function EditRecordPage() {
  const { windowId, tabId, recordId } = useParams<WindowParams>();
  const { t } = useTranslation();

  const { windowData, tab, loading: metadataLoading } = useMetadataContext();
  const { record, loading: recordLoading, loaded, error: recordError } = useSingleDatasource(tab?.entityName, recordId);

  const {
    formData,
    loading: formLoading,
    error: formError,
  } = useFormInitialization({
    tabId,
    mode: 'EDIT',
    recordId,
  });

  const formRef = useRef<{ handleSave: () => Promise<void> }>();

  const handleSave = useCallback(async () => {
    if (formRef.current) {
      try {
        await formRef.current.handleSave();
      } catch (error) {
        console.error('Error saving form:', error);
      }
    }
  }, []);

  if ((metadataLoading || recordLoading || formLoading) && !recordError && !formError && !loaded) {
    return <Spinner />;
  }

  const error = recordError || formError;
  if (error) {
    return <ErrorDisplay title={t('errors.formData.title')} description={error.message} showHomeButton />;
  }

  if (!windowData || !tab || !record || !formData) {
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
        <Toolbar windowId={windowId} tabId={tabId} isFormView={true} onSave={handleSave} />
      </div>
      <DynamicFormView ref={formRef} tab={tab} record={record} formState={formData} windowId={windowId} tabId={tabId} />
    </>
  );
}
