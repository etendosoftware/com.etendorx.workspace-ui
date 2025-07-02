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
    return customColumns;
  }, [tab.fields, handleClickRedirect, handleKeyDownRedirect]);

  return columns;
};
