import { memo, useCallback, useMemo, useState } from 'react';
import { FormData } from './types';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData, mapWindowMetadata } from '../../utils/FormUtils';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { useForm, FormProvider } from 'react-hook-form';
import { buildFormState } from '@workspaceui/etendohookbinder/src/utils/metadata';

function DynamicFormView({ tab, record }: { tab: Tab; record: Record<string, unknown> }) {
  const { windowData = {} as WindowMetadata } = useMetadataContext();
  const navigate = useRouter().push;
  const [formData] = useState<FormData | null>(adaptFormData(tab, record));
  const mappedMetadata = useMemo(() => mapWindowMetadata(windowData), [windowData]);
  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);
  const handleLabelClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const methods = useForm({
    defaultValues: buildFormState(tab.fields, record),
    criteriaMode: 'all',
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  return (
    <FormProvider {...methods}>
      <FormView
        data={formData}
        onSave={handleSave}
        onCancel={handleCancel}
        windowMetadata={mappedMetadata}
        initialValues
        tab={tab}
        onLabelClick={handleLabelClick}
      />
    </FormProvider>
  );
}

export default memo(DynamicFormView, () => true);
