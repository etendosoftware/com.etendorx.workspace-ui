import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import {
  Box,
  DynamicTable,
} from '@workspaceui/componentlibrary/src/components';
import { useEffect, useMemo, useState } from 'react';
import { parseColumns } from '../../helpers/metadata';
import { DRAWER_WIDTH_CLOSED } from '@workspaceui/componentlibrary/src/components/Drawer/styles';

export default function DynamicTableScreen(props: { windowId: string }) {
  const [records, setRecords] = useState([]);
  const { data: windowData } = useWindow(props.windowId);
  const { data: columnsData } = useColumns(
    windowData?.properties.viewProperties.tabId,
  );

  const columns = useMemo(() => parseColumns(columnsData), [columnsData]);

  useEffect(() => {
    const f = async () => {
      const result = await Datasource.get('Order', {
        _startRow: '0',
        _endRow: '10',
      });
      setRecords(result.response.data);
    };

    f();
  }, []);

  return (
    <Box height="100%" paddingLeft={`${DRAWER_WIDTH_CLOSED}px`}>
      <Box padding="0.5rem" height="100%" overflow="auto">
        <DynamicTable columns={columns} data={records} />
      </Box>
    </Box>
  );
}
