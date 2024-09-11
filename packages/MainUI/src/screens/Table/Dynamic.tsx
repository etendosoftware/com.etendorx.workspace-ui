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
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

function Content({ windowData }: { windowData: WindowMetadata }) {
  const { getColumns } = useMetadataContext();

  const columnsData = getColumns(windowData.tabs[0].id)

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
  const { windowData, loading, error } = useWindow(id);

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message}</div>;
  } else if (recordId) {
    return <Outlet />;
  } else {
    return <Content windowData={windowData} />;
  }
}
