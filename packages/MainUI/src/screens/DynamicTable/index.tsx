import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import {
  DynamicTable,
  Spinner,
} from '@workspaceui/componentlibrary/src/components';
import { useMemo } from 'react';
import { parseColumns } from '../../helpers/metadata';
import Box from '@mui/material/Box';

export default function DynamicTableScreen(props: { windowId: string }) {
  const { data: windowData, loading: loadingWindow } = useWindow(
    props.windowId,
  );
  const { data: columnsData, loading: loadingColumns } = useColumns(
    windowData?.properties.viewProperties.tabId,
  );
  const { data: records, loading: loadingData } = useDatasource(
    windowData?.properties.viewProperties.entity,
  );

  const columns = useMemo(() => parseColumns(columnsData), [columnsData]);

  if (loadingData || loadingWindow || loadingColumns) {
    return <Spinner />;
  } else {
    return (
      <Box padding={1}>
        <DynamicTable columns={columns} data={records} />
      </Box>
    );
  }
}
