'use client';

import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import { useDynamicForm } from '@/hooks/useDynamicForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import FormView from '@/components/Form/FormView';

function Page({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { recordId } = useParams<{ recordId: string }>();
  const { loading, formInitialization, refetch, error } = useDynamicForm({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

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

  if (loading) {
    return <Spinner />;
  }

  return <FormView mode={FormMode.EDIT} tab={tab} window={window} formInitialization={formInitialization} />;
}

export default function EditRecordPage() {
  const { window, tab } = useMetadataContext();

  if (!window || !tab) {
    return null;
  }

  return <Page tab={tab} window={window} />;
}
