'use client';

import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import { useFormInitialization } from '@/hooks/useFormInitialization';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import FormView from '@/components/Form/FormView';
import TabContextProvider from '@/contexts/tab';
import { useFormInitialState } from '@/hooks/useFormInitialState';

function Page({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { recordId } = useParams<{ recordId: string }>();
  const { loading, formInitialization, refetch, error } = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
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
    return null;
  }

  return <FormView mode={FormMode.EDIT} tab={tab} window={window} initialState={initialState} refetch={refetch} />;
}

export default function EditRecordPage() {
  const { window, tab } = useMetadataContext();

  if (!window || !tab) {
    return null;
  }

  return (
    <TabContextProvider tab={tab}>
      <Page tab={tab} window={window} />
    </TabContextProvider>
  );
}
