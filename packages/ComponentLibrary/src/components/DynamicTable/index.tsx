import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

export default function DynamicTable(
  params: Parameters<typeof useMaterialReactTable>[0],
) {
  const table = useMaterialReactTable(params);

  return <MaterialReactTable table={table} />;
}
