/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
