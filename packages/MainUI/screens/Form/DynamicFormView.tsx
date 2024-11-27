import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormData } from './types';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData, mapWindowMetadata } from '../../utils/FormUtils';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { useForm, FormProvider } from 'react-hook-form';

export default function DynamicFormView({ tab, record }: { tab: Tab; record: Record<string, unknown> }) {
  const { windowData = {} as WindowMetadata } = useMetadataContext();
  const methods = useForm();
  const navigate = useRouter().push;
  const [formData, setFormData] = useState<FormData | null>(adaptFormData(tab, record));
  const mappedMetadata = useMemo(() => mapWindowMetadata(windowData), [windowData]);
  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => {
    const the = Object.entries(tab.fields).reduce((acc, [fieldName, field]) => {
      acc['inp' + field.inpName] = record[fieldName]; // fieldName in record ? record[fieldName] : 'TUVIEJA';

      return acc;
    }, {} as Record<string, any>);

    console.debug('eaea');
    console.debug(the);
    console.debug(record);
  }, [record, tab]);

  const handleChange = useCallback((updatedData: FormData) => {
    setFormData(updatedData);
  }, []);

  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  return (
    <FormProvider {...methods}>
      <FormView
        data={formData}
        onSave={handleSave}
        onCancel={handleCancel}
        onChange={handleChange}
        windowMetadata={mappedMetadata}
        initialValues
      />
    </FormProvider>
  );
}
