'use client';

import { styles } from '../[recordId]/styles';
import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useTranslation } from '@/hooks/useTranslation';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from '@/components/Form/FormView/selectors/BaseSelector';
import { useMemo } from 'react';
import { buildUpdatedValues, getCombinedEntries } from '@/utils';

function Page({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { loading, record, formInitialization, refetch, error, fieldsByColumnName } = useDynamicForm({
    tab,
    mode: FormMode.NEW,
  });

  const values = useMemo(() => {
    if (!formInitialization) return { ...record };

    const combinedEntries = getCombinedEntries(formInitialization);
    const updatedValues = buildUpdatedValues(combinedEntries, fieldsByColumnName);

    return { ...record, ...updatedValues };
  }, [fieldsByColumnName, formInitialization, record]);

  const form = useForm({ values });

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

  if (loading || !formInitialization) {
    return <Spinner />;
  }

  return (
    <FormProvider {...form}>
      <div style={styles.box}>
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} />
      </div>
      <div className="p-2 space-y-4">
        {Object.entries(tab.fields).map(([hqlName, field]) => (
          <BaseSelector field={field} key={hqlName} />
        ))}
      </div>
    </FormProvider>
  );
}

export default function EditRecordPage() {
  const { window, tab } = useMetadataContext();

  if (!window || !tab) {
    return null;
  }

  return <Page tab={tab} window={window} />;
}
