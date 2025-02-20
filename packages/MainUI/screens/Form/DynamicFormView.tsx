import { memo, useCallback, useMemo, useState } from 'react';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData } from '../../utils/FormUtils';
import { useForm, FormProvider, UseFormProps } from 'react-hook-form';
import { buildFormState } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { FormInitializationResponse } from '../../hooks/useFormInitialValues';
import FormView from '@/components/Form/FormView';
import { FormData } from '@/components/Form/FormView/types';

function DynamicFormView({
  tab,
  record,
  formState,
}: {
  tab: Tab;
  record: Record<string, unknown>;
  formState?: FormInitializationResponse;
}) {
  const navigate = useRouter().push;
  const [formData] = useState<FormData | null>(adaptFormData(tab, record));
  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);
  const handleLabelClick = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const formOptions = useMemo<UseFormProps>(
    () => ({
      defaultValues: buildFormState(tab.fields, record, formState as never),
      criteriaMode: 'all',
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
      progressive: true,
    }),
    [formState, record, tab.fields],
  );

  const methods = useForm(formOptions);

  if (!formData) return <div>No form data available</div>;

  console.log('formData', formData, 'formOptions:', formOptions);

  return (
    <FormProvider {...methods}>
      <FormView
        data={formData}
        onSave={handleSave}
        onCancel={handleCancel}
        initialValues
        tab={tab}
        onLabelClick={handleLabelClick}
        readOnly={formState?._readOnly}
        sessionAttributes={formState?.sessionAttributes}
        auxiliaryInputValues={formState?.auxiliaryInputValues}
      />
    </FormProvider>
  );
}

export default memo(DynamicFormView, () => true);
