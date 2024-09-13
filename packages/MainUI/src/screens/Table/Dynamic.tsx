import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { Outlet, useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';

function Content({ windowData }: { windowData: WindowMetadata }) {
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
      <>
        {windowData.tabs.map(tab => {
          return (
            <DynamicTable
              columns={parseColumns(Object.values(tab.fields))}
              data={records}
              fetchMore={fetchMore}
              loading={loading}
              tab={tab}
            />
          );
        })}
      </>
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
