import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';

function Content({
  windowData,
  columnsData,
}: {
  windowData: WindowMetadata;
  columnsData: Record<string, Column[]>;
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
  const columns = useMemo(
    () => columnsData[windowData.tabs[0].id],
    [columnsData, windowData.tabs],
  );

  if (loading && !loaded) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else {
    return (
      <DynamicTable
        columns={columns}
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
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <Content windowData={windowData} columnsData={columnsData} />;
  }
}
