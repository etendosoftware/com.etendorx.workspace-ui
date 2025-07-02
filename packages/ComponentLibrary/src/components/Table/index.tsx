import { getColumns } from "@workspaceui/storybook/src/stories/Components/Table/columns";
import type { OrganizationField, TableProps } from "@workspaceui/storybook/src/stories/Components/Table/types";
import { type MRT_Row, type MRT_TableOptions, MaterialReactTable, useMaterialReactTable } from "material-react-table";
import type React from "react";
import { useMemo } from "react";
import { useStyle } from "./styles";

type TableDataType = Record<string, unknown>;

export interface EnhancedTableProps extends TableProps {
  onRowClick: (row: MRT_Row<TableDataType>) => void;
  onRowDoubleClick: (row: MRT_Row<TableDataType>) => void;
}

const Table: React.FC<EnhancedTableProps> = ({ data = [], onRowClick, onRowDoubleClick }) => {
  const { sx } = useStyle();
  const columns = useMemo(() => getColumns(), []);

  const tableData = useMemo(() => {
    return data.map((item) => {
      const flatItem: TableDataType = {};
      for (const [key, field] of Object.entries(item)) {
        if ("value" in field && typeof field !== "function") {
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
      density: "compact",
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
    columnResizeMode: "onChange",
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } as MRT_TableOptions<any>);

  return <MaterialReactTable table={table} />;
};

export default Table;
