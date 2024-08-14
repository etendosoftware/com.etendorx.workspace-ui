import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '../../hooks/useWindow';
import { useDatasource } from '../../hooks/useDatasource';

export default function DynamicTableScreen() {
  const { id = '143', recordId = '' } = useParams();

  const { windowData, columnsData, loading, error } = useWindow(id);
  const { data: records, loading: loadingData } = useDatasource(
    windowData?.properties.viewProperties.entity,
  );

  if (error) {
    return <div>{error?.message}</div>;
  } else if (loading || loadingData) {
    return <Spinner />;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <DynamicTable columns={columnsData} data={records} />;
  }
}
