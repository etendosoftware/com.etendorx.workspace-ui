'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { adaptFormData } from '../../../../../utils/FormUtils';
import { styles } from '../[recordId]/styles';
import { useFormInitialization } from '../../../../../hooks/useFormInitialValues';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { useTranslation } from '../../../../../hooks/useTranslation';

export default function NewRecordPage() {
  const { windowId, tabId } = useParams<{
    windowId: string;
    tabId: string;
  }>();

  const { t } = useTranslation();
  const { windowData, tab } = useMetadataContext();
  const { initialData, loading, error } = useFormInitialization(tabId);

  const record = useMemo(() => {
    if (!initialData?.columnValues) return {} as Record<string, unknown>;

    return Object.entries(initialData.columnValues).reduce((acc, [key, value]) => {
      acc[key] = value.value;
      if (value.identifier) {
        acc[`${key}$_identifier`] = value.identifier;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }, [initialData]);

  const adaptedData = useMemo(() => {
    if (!tab || !record) return null;
    return adaptFormData(tab, record);
  }, [tab, record]);

  if (loading) {
    return <ErrorDisplay title={t('common.loading')} description={t('common.loadingFormData')} />;
  }

  if (error) {
    return <ErrorDisplay title={t('errors.formData.title')} description={error.message} showHomeButton />;
  }

  if (!windowData || !tab || !initialData) {
    return (
      <ErrorDisplay
        title={t('errors.missingData.title')}
        description={t('errors.missingData.description')}
        showHomeButton
      />
    );
  }

  if (!adaptedData) {
    return (
      <ErrorDisplay
        title={t('errors.adaptingData.title')}
        description={t('errors.adaptingData.description')}
        showRetry
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <div style={styles.box}>
        <Toolbar windowId={windowId} tabId={tabId} />
      </div>
      <DynamicFormView windowData={windowData} tab={tab} record={record} />
    </>
  );
}
