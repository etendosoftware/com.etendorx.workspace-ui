import { useCallback, useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRouter } from "next/navigation";

export const useColumns = (tab: Tab) => {
  const router = useRouter();

  const handleAction = useCallback(
    (windowId: string | undefined) => {
      if (!windowId) return;
      router.push(`/window?windowId=${windowId}`);
    },
    [router]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent, windowId: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction(windowId);
    },
    [handleAction]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, windowId: string | undefined) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction(windowId);
      }
    },
    [handleAction]
  );

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
                onClick={(e) => handleClick(e, windowId)}
                onKeyDown={(e) => handleKeyDown(e, windowId)}>
                {cell.getValue<string>()}
              </span>
            );
          },
        };
      }
      return column;
    });
    return customColumns;
  }, [tab.fields, handleClick, handleKeyDown]);

  return columns;
};
