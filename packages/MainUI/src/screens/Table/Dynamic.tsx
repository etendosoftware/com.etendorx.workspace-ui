import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Tabs from './Tabs';

export default function DynamicTableScreen() {
  const { id = '143', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(id);

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <Tabs tabs={windowData.tabs} />
  }
}
