import React, { useMemo } from 'react';
import { MaterialReactTable, MRT_Row, MRT_TableOptions, useMaterialReactTable } from 'material-react-table';
import { TableProps, OrganizationField } from '../../../../storybook/src/stories/Components/Table/types';
import { useStyle } from './styles';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';

type TableDataType = Record<string, unknown>;

export interface EnhancedTableProps extends TableProps {
  onRowClick: (row: MRT_Row<TableDataType>) => void;
  onRowDoubleClick: (row: MRT_Row<TableDataType>) => void;
}

const Table: React.FC<EnhancedTableProps> = ({ data = [], onRowClick, onRowDoubleClick }) => {
  const { sx } = useStyle();
  const columns = useMemo(() => getColumns(), []);

  const tableData = useMemo(() => {
    return data.map(item => {
      const flatItem: TableDataType = {};
      for (const [key, field] of Object.entries(item)) {
        if ('value' in field && typeof field !== 'function') {
          flatItem[key] = (field as OrganizationField & { value: unknown }).value;
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
      sx: sx.tableBodyRow,
    }),
    muiTableBodyProps: {
      sx: sx.tableBody,
    },
    muiTableHeadCellProps: {
      sx: sx.tableHeadCell,
    },
    muiTableBodyCellProps: {
      sx: sx.tableBodyCell,
    },
    columnResizeMode: 'onChange',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as MRT_TableOptions<any>);

  return <MaterialReactTable table={table} />;
};

export default Table;
