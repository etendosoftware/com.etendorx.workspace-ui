import { useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_Row,
  MRT_TableOptions,
  useMaterialReactTable,
} from 'material-react-table';
import { TableProps } from '../../../../storybook/src/stories/Components/Table/types';
import { tableStyles } from './styles';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';

interface EnhancedTableProps extends TableProps {
  onRowClick: (row: MRT_Row<{ [key: string]: any }>) => void;
  onRowDoubleClick: (row: MRT_Row<{ [key: string]: any }>) => void;
}

const Table: React.FC<EnhancedTableProps> = ({
  data,
  onRowClick,
  onRowDoubleClick,
}) => {
  const columns = useMemo(() => getColumns(), []);

  const tableData = useMemo(() => {
    return data.map(item => {
      const flatItem: { [key: string]: any } = {};
      for (const [key, field] of Object.entries(item)) {
        if ('value' in field) {
          flatItem[key] = field.value;
        }
      }
      return flatItem;
    });
  }, [data]);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    initialState: {
      density: 'compact',
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onRowClick(row),
      onDoubleClick: () => onRowDoubleClick(row),
      sx: tableStyles.tableBodyRow,
    }),
    muiTableBodyProps: {
      sx: tableStyles.tableBody,
    },
    muiTableHeadCellProps: {
      sx: tableStyles.tableHeadCell,
    },
    muiTableBodyCellProps: {
      sx: tableStyles.tableBodyCell,
    },
    columnResizeMode: 'onChange',
  } as MRT_TableOptions<{ [key: string]: string }>);

  return <MaterialReactTable table={table} />;
};

export default Table;
