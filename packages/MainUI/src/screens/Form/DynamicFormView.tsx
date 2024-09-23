import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { FormData } from './types';
import FormView from '../../components/FormView';
import { adaptFormData, mapWindowMetadata } from '../../utils/formUtils';

export default function DynamicFormView() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const {
    windowData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(id ?? '');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [mappedMetadata, setMappedMetadata] = useState<any>(null);

  const {
    records,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useDatasource(windowData?.tabs[0] ?? null, {
    criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
  });

  useEffect(() => {
    console.log('useEffect triggered');
    console.log('windowData:', windowData);
    console.log('records:', records);

    if (windowData && records && records.length > 0) {
      console.log('Conditions met for adapting data');
      const newFormData = adaptFormData(windowData, records[0]);
      console.log('New form data:', newFormData);
      if (newFormData) setFormData(newFormData);

      const newMappedMetadata = mapWindowMetadata(windowData);
      console.log('New mapped metadata:', newMappedMetadata);
      setMappedMetadata(newMappedMetadata);
    } else {
      console.log('Conditions not met for adapting data');
    }
  }, [windowData, records]);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const handleChange = useCallback((updatedData: FormData) => {
    console.log('Form data changed:', updatedData);
    setFormData(updatedData);
  }, []);

  if (windowLoading || (recordLoading && !loaded)) return <Spinner />;
  if (windowError)
    return <div>Error loading window data: {windowError.message}</div>;
  if (recordError)
    return <div>Error loading record data: {recordError.message}</div>;
  if (!windowData) return <div>No window data available</div>;
  if (!records || records.length === 0) return <div>No record found</div>;
  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  console.log('Passing to FormView:', { windowData: mappedMetadata, formData });

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
