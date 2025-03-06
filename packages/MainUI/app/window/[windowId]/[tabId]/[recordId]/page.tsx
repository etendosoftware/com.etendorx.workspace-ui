'use client';

import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useMemo } from 'react';
import { buildUpdatedValues, getCombinedEntries } from '@/utils';
import FormView from '@/components/Form/FormView';

function Page({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { recordId } = useParams<{ recordId: string }>();
  const { loading, record, formInitialization, fieldsByColumnName, refetch, error } = useDynamicForm({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

  const values = useMemo(() => {
    if (!formInitialization) return {};

    const combinedEntries = getCombinedEntries(formInitialization);
    const updatedValues = buildUpdatedValues(combinedEntries, fieldsByColumnName);

    return { ...record, ...updatedValues };
  }, [fieldsByColumnName, formInitialization, record]);

  if (error) {
    return (
      <ErrorDisplay
        title={t('errors.formData.title')}
        description={error.message}
        onRetry={refetch}
        showRetry
        showHomeButton
      />
    );
  }

  if (loading || !formInitialization || !record) {
    console.debug({ loading, formInitialization, record });
    return <Spinner />;
  }

  return <FormView mode={FormMode.EDIT} defaultValues={values} tab={tab} window={window} />;
}

export default function EditRecordPage() {
  const { window, tab } = useMetadataContext();

  if (!window || !tab) {
    return null;
  }

  return <Page tab={tab} window={window} />;
}
