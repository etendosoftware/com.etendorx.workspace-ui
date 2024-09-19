import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormView from '../../components/FormView';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useEntityRecord } from '@workspaceui/etendohookbinder/src/hooks/useEntityRecord';
import { adaptFormData } from '../../utils/formUtils';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { FormData } from './types';

export default function DynamicFormView() {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const navigate = useNavigate();

  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();
  const [formData, setFormData] = useState<FormData | null>(null);

  const {
    data,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useEntityRecord(windowData?.tabs[0].entityName ?? '', recordId);

  useEffect(() => {
    console.log('loaded record', data);
  }, [data]);

  const updateFormData = useCallback(() => {
    const colls = Object.values(columnsData[windowData.tabs[0].id]);

    const newFormData = adaptFormData(
      windowData,
      colls,
      data ?? {},
    );
    if (newFormData) setFormData(newFormData);
  }, [windowData, columnsData, data]);

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
