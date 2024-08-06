import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { DRAWER_WIDTH_CLOSED } from '@workspaceui/componentlibrary/src/components/Drawer/styles';
import {
  Box,
  DynamicTable,
} from '@workspaceui/componentlibrary/src/components';
import { useMemo } from 'react';
import { parseColumns } from '../../helpers/metadata';
import CircularProgress from '@mui/material/CircularProgress';

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

  return (
    <Box height="100%" paddingLeft={`${DRAWER_WIDTH_CLOSED}px`} overflow="auto">
      <Box
        padding="0.5rem"
        justifyContent="center"
        alignItems="center"
        display="flex"
        width="100%">
        {loadingData || loadingWindow || loadingColumns ? (
          <CircularProgress />
        ) : (
          <DynamicTable columns={columns} data={records} />
        )}
      </Box>
    </Box>
  );
}
