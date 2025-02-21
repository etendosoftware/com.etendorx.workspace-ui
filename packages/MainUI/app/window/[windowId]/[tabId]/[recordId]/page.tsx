'use client';

import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import { Toolbar } from '../../../../../components/Toolbar/Toolbar';
import { styles } from '../[recordId]/styles';
import { useFormInitialization } from '../../../../../hooks/useFormInitialization';
import { ErrorDisplay } from '../../../../../components/ErrorDisplay';
import { FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';

function Page({ window, tab }: { window: WindowMetadata; tab: Tab }) {
  const { t } = useTranslation();
  const { recordId } = useParams<{ recordId: string }>();
  const { loading, record, formInitialization, refetch, error } = useFormInitialization({
    tab,
    mode: FormMode.EDIT,
    recordId,
  });

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

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <div style={styles.box}>
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} />
      </div>
      <div>
        <h2>Form Initialization</h2>
        <pre>
          <code>{JSON.stringify(formInitialization, null, 2)}</code>
        </pre>
      </div>
      <div>
        <h2>Record</h2>
        <pre>
          <code>{JSON.stringify(record, null, 2)}</code>
        </pre>
      </div>
    </>
  );
}

export default function EditRecordPage() {
  const { window, tab } = useMetadataContext();

  if (!window || !tab) {
    return null;
  }

  return <Page tab={tab} window={window} />;
}
