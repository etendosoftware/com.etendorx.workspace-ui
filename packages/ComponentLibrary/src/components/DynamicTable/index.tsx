import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { memo } from 'react';

export default memo(function DynamicTable(
  params: Parameters<typeof useMaterialReactTable>[0],
) {
  const table = useMaterialReactTable(params);

  return <MaterialReactTable table={table} />;
});
