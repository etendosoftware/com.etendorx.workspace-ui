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

export default function DynamicTableScreen(props: { windowId: string }) {
  const { data: windowData } = useWindow(props.windowId);
  const { data: columnsData } = useColumns(
    windowData?.properties.viewProperties.tabId,
  );
  const { data: records } = useDatasource('Order');

  const columns = useMemo(() => parseColumns(columnsData), [columnsData]);


  return (
    <Box height="100%" paddingLeft={`${DRAWER_WIDTH_CLOSED}px`}>
      <Box padding="0.5rem" height="100%" overflow="auto">
        <DynamicTable columns={columns} data={records} />
      </Box>
    </Box>
  );
}
