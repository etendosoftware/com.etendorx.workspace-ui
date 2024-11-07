import { createContext, useCallback, useMemo, useState } from 'react';
import { FormData } from './types';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { useRouter } from 'next/navigation';
import { adaptFormData, mapWindowMetadata } from '../../utils/FormUtils';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';
import { useMetadataContext } from '../../hooks/useMetadataContext';

const FormContext = createContext({});

export default function DynamicFormView({
  tab,
  record,
}: {
  tab: Tab;
  record: Record<string, unknown>;
}) {
  const { windowData = {} as WindowMetadata } = useMetadataContext();
  const navigate = useRouter().push;
  const [formData, setFormData] = useState<FormData | null>(adaptFormData(tab, record));
  const mappedMetadata = useMemo(() => mapWindowMetadata(windowData), [windowData]);
  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const handleChange = useCallback((updatedData: FormData) => {
    setFormData(updatedData);
  }, []);

  const value = useMemo(() => ({ formData, setFormData }), [formData]);

  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  return (
    <FormContext.Provider value={value}>
      <FormView
        data={formData}
        onSave={handleSave}
        onCancel={handleCancel}
        onChange={handleChange}
        windowMetadata={mappedMetadata}
      />
    </FormContext.Provider>
  );
}
