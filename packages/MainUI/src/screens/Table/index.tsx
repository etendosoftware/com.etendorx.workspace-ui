import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMemo } from 'react';
import { parseColumns } from '../../helpers/metadata';
import { useParams } from 'react-router-dom';

export default function DynamicTableScreen() {
  const { id = '' } = useParams();

  const {
    data: windowData,
    loading: loadingWindow,
    error: windowError,
  } = useWindow(id);
  const {
    data: columnsData,
    loading: loadingColumns,
    error: columnsError,
  } = useColumns(windowData?.properties.viewProperties.tabId);
  const { data: records, loading: loadingData } = useDatasource(
    windowData?.properties.viewProperties.entity,
  );
  const columns = useMemo(() => parseColumns(columnsData), [columnsData]);

  if (windowError || columnsError) {
    return <div>{windowError?.message ?? columnsError?.message}</div>;
  } else if (loadingData || loadingWindow || loadingColumns) {
    return <Spinner />;
  } else {
    return <DynamicTable columns={columns} data={records} />;
  }
}
