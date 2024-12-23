'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar/Toolbar';
import DynamicFormView from '../../../../../screens/Form/DynamicFormView';
import { adaptFormData } from '../../../../../utils/FormUtils';
import { styles } from '../[recordId]/styles';
import { useFormInitialization } from '../../../../../hooks/useFormInitialValues';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { useTranslation } from '../../../../../hooks/useTranslation';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import MultiSelect from '@workspaceui/componentlibrary/src/components/FormView/selectors/MultiSelector';
import { WindowParams } from '../../../../types';

interface Option<T extends string = string> {
  title: string;
  value: T;
  id: string;
}

export default function NewRecordPage() {
  const { windowId, tabId } = useParams<WindowParams>();

  const [selectedValues, setSelectedValues] = useState<Option[]>([]);

  const { t } = useTranslation();
  const { windowData, tab, loading: metadataLoading } = useMetadataContext();
  const { initialData, loading: formLoading, error } = useFormInitialization(tabId);

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

  if (metadataLoading || formLoading) {
    return <Spinner />;
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
        <div style={{ padding: '2rem' }}>
          <MultiSelect value={selectedValues} onChange={setSelectedValues} tab={''} />
        </div>
      </div>
      <DynamicFormView tab={tab} record={record} />
    </>
  );
}
