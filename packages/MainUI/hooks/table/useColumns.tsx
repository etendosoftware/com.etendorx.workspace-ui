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

import { useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { transformColumnsWithCustomJs } from "@/utils/customJsColumnTransformer";

export const useColumns = (tab: Tab) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  const columns = useMemo(() => {
    const fieldsAsArray = Object.values(tab.fields);
    const originalColumns = parseColumns(fieldsAsArray);

    const referencedColumns = originalColumns.map((column: Column) => {
      const isReference = isEntityReference(getFieldReference(column.column?.reference));

      if (isReference) {
        const windowId = column.referencedWindowId;
        const windowIdentifier = column._identifier;
        return {
          ...column,
          Cell: ({ cell }: { cell: MRT_Cell<EntityData, unknown> }) => {
            return (
              <button
                type="button"
                tabIndex={0}
                aria-label="Navigate to referenced window"
                className="bg-transparent border-none p-0 text-(--color-dynamic-main) hover:underline text-left"
                onClick={(e) => handleClickRedirect(e, windowId, windowIdentifier)}
                onKeyDown={(e) => handleKeyDownRedirect(e, windowId, windowIdentifier)}>
                {cell.getValue<string>()}
              </button>
            );
          },
        };
      }
      return column;
    });

    // Apply custom JavaScript code
    const customJsColumns = transformColumnsWithCustomJs(
      referencedColumns,
      fieldsAsArray
    );

    return customJsColumns;
  }, [tab.fields, handleClickRedirect, handleKeyDownRedirect]);

  return columns;
};
