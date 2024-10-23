import { useCallback, useEffect, useState } from 'react';
import FormView from '@/components/FormView';
import { Organization } from '../../../../storybook/src/stories/Components/Table/types';
import { mockOrganizations } from '@workspaceui/storybook/stories/Components/Table/mock';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { useRouter } from 'next/navigation';

const { id } = { id: ''};

export default function Form() {
  const navigate = useRouter().push;
  const [formData, setFormData] = useState<Organization | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const foundItem = mockOrganizations.find(item => item.id.value === id);

      if (foundItem) {
        setFormData(foundItem);
      }
    };
    loadData();
  }, []);

  const handleSave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!formData) {
    return <Spinner />;
  }

  return <FormView data={formData} onSave={handleSave} onCancel={handleCancel} />;
}
