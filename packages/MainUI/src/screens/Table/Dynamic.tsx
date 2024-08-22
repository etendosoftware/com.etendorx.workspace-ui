import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '../../hooks/useWindow';
import { useDatasource } from '../../hooks/useDatasource';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

function Content({
  windowData,
  columnsData,
}: {
  windowData: WindowMetadata;
  columnsData: Column[];
}) {
  const { records, loading, error, fetchMore, loaded } = useDatasource(
    windowData,
    {
      sortBy: 'documentNo',
      operator: 'or',
      criteria: [
        {
          fieldName: 'documentNo',
          operator: 'iContains',
          value: '100',
        },
        {
          fieldName: 'active',
          operator: 'equals',
          value: 'true',
        },
      ],
    },
  );

  if (loading && !loaded) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else {
    return (
      <DynamicTable
        columns={columnsData}
        data={records}
        fetchMore={fetchMore}
        loading={loading}
      />
    );
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
