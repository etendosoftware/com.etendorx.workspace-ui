import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { FormData } from './types';
import FormView from '../../components/FormView';
import { adaptFormData, mapWindowMetadata } from '../../utils/formUtils';
import { MappedData } from '@workspaceui/etendohookbinder/api/types';

export default function DynamicFormView() {
  const { windowId = '', recordId } = useParams<{
    windowId: string;
    recordId: string;
  }>();
  const navigate = useNavigate();
  const {
    windowData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(windowId);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [mappedMetadata, setMappedMetadata] = useState<MappedData | null>(null);

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [recordId],
  );

  const {
    records,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useDatasource(windowData?.tabs[0].entityName ?? '', query);

  useEffect(() => {
    if (windowData && records && records.length > 0) {
      const newFormData = adaptFormData(windowData, records[0]);
      if (newFormData) setFormData(newFormData);

      const newMappedMetadata = mapWindowMetadata(windowData);
      setMappedMetadata(newMappedMetadata);
    }
  }, [windowData, records]);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const handleChange = useCallback((updatedData: FormData) => {
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
