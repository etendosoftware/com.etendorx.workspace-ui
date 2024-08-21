import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormView } from '@workspaceui/componentlibrary/src/components';
import { Organization } from '../../../../storybook/src/stories/Components/Table/types';
import { mockOrganizations } from '@workspaceui/storybook/stories/Components/Table/mock';

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
      } else {
        console.error(`No se encontró ningún elemento con el ID: ${id}`);
      }
    };
    loadData();
  }, [id]);

  const handleSave = () => {
    console.log('Saving data...');
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (!formData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <FormView data={formData} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
