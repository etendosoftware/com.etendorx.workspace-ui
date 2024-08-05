import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { Box, DynamicTable } from '@workspaceui/componentlibrary/src/components';
import { parseColumns } from '../../helpers/metadata';
import { useEffect, useMemo, useState } from 'react';

export default function SalesOrder() {
  const [records, setRecords] = useState([]);
  const { data: windowData } = useWindow('143');
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
    <Box width="100%" padding="0.25rem">
      <DynamicTable columns={columns} data={records} />
    </Box>
  );
}
