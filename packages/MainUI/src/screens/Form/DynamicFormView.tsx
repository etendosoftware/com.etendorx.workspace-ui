import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormView from '../../components/FormView';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { FormData } from './types';
import { adaptFormData } from '../../utils/formUtils';

export default function DynamicFormView() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();

  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(id ?? '');

  const [formData, setFormData] = useState<FormData | null>(null);

  const {
    records,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useDatasource(windowData, {
    criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
  });

  const updateFormData = useCallback(() => {
    const newFormData = adaptFormData(windowData, columnsData, records);
    if (newFormData) setFormData(newFormData);
  }, [windowData, columnsData, records]);

  useEffect(() => {
    updateFormData();
  }, [updateFormData]);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  if (windowLoading && recordLoading && !loaded) return <Spinner />;
  if (windowError || recordError)
    return <div>Error: {windowError?.message || recordError?.message}</div>;
  if (!formData) return <div>No data available</div>;

  return (
    <FormView data={formData} onSave={handleSave} onCancel={handleCancel} />
  );
}
