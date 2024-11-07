import { useCallback, useEffect, useState } from 'react';
import { Organization } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { mockOrganizations } from '@workspaceui/storybook/src/stories/Components/Table/mock';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useRouter, useParams } from 'next/navigation';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';

export default function Form() {
  const navigate = useRouter().push;
  const params = useParams();
  const [formData, setFormData] = useState<Organization | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const foundItem = mockOrganizations.find(item => item.id.value === params.id);

      if (foundItem) {
        setFormData(foundItem);
      }
    };
    loadData();
  }, [params.id]);

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
