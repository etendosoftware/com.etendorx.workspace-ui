import { useCallback, useEffect, useState } from 'react';
import FormView from '../../app/components/FormView';
import { useParams, useNavigate } from 'react-router-dom';
import { Organization } from '../../../../storybook/src/stories/Components/Table/types';
import { mockOrganizations } from '@workspaceui/storybook/stories/Components/Table/mock';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';

export default function Form() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  }, [id]);

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
