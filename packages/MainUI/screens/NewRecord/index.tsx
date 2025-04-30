'use client';

import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormInitialization } from '@/hooks/useFormInitialization';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import FormView from '@/components/Form/FormView';
import { useFormInitialState } from '@/hooks/useFormInitialState';

export default function NewRecordPage({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { loading, formInitialization, refetch, error } = useFormInitialization({
    tab,
    mode: FormMode.NEW,
  });
  const initialState = useFormInitialState(formInitialization);

  if (error) {
    return (
      <div className="mt-40">
        <ErrorDisplay
          title={t('errors.formData.title')}
          description={error.message}
          onRetry={refetch}
          showRetry
          showHomeButton
        />
      </div>
    );
  }

  if (loading || !initialState) {
    return <Spinner />;
  }

  return <FormView mode={FormMode.NEW} tab={tab} window={window} />;
}