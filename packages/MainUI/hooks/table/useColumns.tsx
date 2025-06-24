import { useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRedirect } from "@/hooks/navigation/useRedirect";

export const useColumns = (tab: Tab) => {
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  const columns = useMemo(() => {
    const originalColumns = parseColumns(Object.values(tab.fields));
    const customColumns = originalColumns.map((column: Column) => {
      const isReference = isEntityReference(getFieldReference(column.column?.reference));

      if (isReference) {
        const windowId = column.referencedWindowId;
        return {
          ...column,
          Cell: ({ cell }: { cell: MRT_Cell<EntityData, unknown> }) => {
            return (
              <span
                className="cursor-pointer underline text-blue-500 hover:text-blue-600 hover:scale-105 transition-transform duration-200 ease-in-out"
                onClick={(e) => handleClickRedirect(e, windowId)}
                onKeyDown={(e) => handleKeyDownRedirect(e, windowId)}>
                {cell.getValue<string>()}
              </span>
            );
          },
        };
      }
      return column;
    });
    return customColumns;
  }, [tab.fields, handleClickRedirect, handleKeyDownRedirect]);

  return columns;
};
