import { useCallback, useMemo, useState } from 'react';
import { FormData } from './types';
import FormView from '@/components/FormView';
import { adaptFormData, mapWindowMetadata } from '../../utils/formUtils';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/api/types';
import { useRouter } from 'next/navigation';

export default function DynamicFormView({
  windowData,
  tab,
  record,
}: {
  windowData: WindowMetadata;
  tab: Tab;
  record: Record<string, unknown>;
}) {
  const navigate = useRouter().push;
  const [formData, setFormData] = useState<FormData | null>(adaptFormData(tab, record));
  const mappedMetadata = useMemo(() => mapWindowMetadata(windowData), [windowData]);
  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const handleChange = useCallback((updatedData: FormData) => {
    setFormData(updatedData);
  }, []);

  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  return (
    <FormView
      data={formData}
      onSave={handleSave}
      onCancel={handleCancel}
      onChange={handleChange}
      windowMetadata={mappedMetadata}
    />
  );
}
