import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { DynamicFormView } from './DynamicFormView';

export default function DynamicForm() {
  const { windowId = '' } = useParams<{ windowId: string }>();
  const { windowData, loading, error } = useWindow(windowId);

  if (loading) {
    return <Spinner />;
  }

  if (error || !windowData) {
    return <div>{error?.message}</div>;
  }

  return <DynamicFormView windowData={windowData} />;
}
