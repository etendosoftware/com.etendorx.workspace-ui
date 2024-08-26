import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_Row,
  MRT_TableOptions,
  useMaterialReactTable,
} from 'material-react-table';
import {
  TableProps,
  OrganizationField,
} from '../../../../storybook/src/stories/Components/Table/types';
import { tableStyles } from './styles';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';

type TableDataType = Record<string, unknown>;

export interface EnhancedTableProps extends TableProps {
  onRowClick: (row: MRT_Row<TableDataType>) => void;
  onRowDoubleClick: (row: MRT_Row<TableDataType>) => void;
}

const Table: React.FC<EnhancedTableProps> = ({
  data = [],
  onRowClick,
  onRowDoubleClick,
}) => {
  const columns = useMemo(() => getColumns(), []);

  const tableData = useMemo(() => {
    return data.map(item => {
      const flatItem: TableDataType = {};
      for (const [key, field] of Object.entries(item)) {
        if ('value' in field && typeof field !== 'function') {
          flatItem[key] = (
            field as OrganizationField & { value: unknown }
          ).value;
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
  } as MRT_TableOptions<TableDataType>);

  return <MaterialReactTable table={table} />;
};

export default Table;
