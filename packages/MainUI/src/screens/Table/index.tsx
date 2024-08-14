import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '../../hooks/useWindow';
import { useDatasource } from '../../hooks/useDatasource';
import {
  Column,
  DatasourceParams,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

const params: Partial<DatasourceParams> = {
  sortBy: 'documentNo',
  startRow: 0,
  endRow: 100,
  operator: 'and',
  criteria: [
    {
      fieldName: 'documentNo',
      operator: 'iContains',
      value: '24',
    },
    {
      fieldName: 'active',
      operator: 'equals',
      value: 'true',
    },
  ],
};

function Content({
  windowData,
  columnsData,
}: {
  windowData: WindowMetadata;
  columnsData: Column[];
}) {
  const { data, loading, error } = useDatasource(windowData, params);

  if (loading) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else {
    return <DynamicTable columns={columnsData} data={data} />;
  }
}

export default function DynamicTableScreen() {
  const { id = '143', recordId = '' } = useParams();
  const { windowData, columnsData, loading, error } = useWindow(id);

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData || !columnsData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <Content columnsData={columnsData} windowData={windowData} />;
  }
}
