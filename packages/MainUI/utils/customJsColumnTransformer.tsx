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

import type { Column, Field } from "@workspaceui/api-client/src/api/types";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell, MRT_Row } from "material-react-table";
import { CustomJsCell } from "@/components/Table/CustomJsCell";

export const transformColumnsWithCustomJs = (originalColumns: Column[], fields: Field[]): Column[] => {
  return originalColumns.map((column) => {
    const field = fields.find((f) => f.id === column.fieldId);

    if (field?.etmetaCustomjs?.trim()) {
      return {
        ...column,
        muiTableBodyCellProps: {
          sx: {
            padding: "0px",
          },
        },
        Cell: ({ cell, row }: { cell: MRT_Cell<EntityData, unknown>; row: MRT_Row<EntityData> }) => {
          return <CustomJsCell cell={cell} row={row} customJsCode={field.etmetaCustomjs} column={column} />;
        },
      };
    }

    return column;
  });
};
