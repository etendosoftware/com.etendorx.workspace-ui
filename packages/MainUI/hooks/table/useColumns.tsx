import { useCallback, useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export const useColumns = (tab: Tab) => {
  const handleAction = useCallback(() => {
    console.log("test");
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleAction();
    },
    [handleAction]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleAction();
      }
    },
    [handleAction]
  );

  const columns = useMemo(() => {
    const originalColumns = parseColumns(Object.values(tab.fields));
    const customColumns = originalColumns.map((column) => {
      if (column.id === "Organization") {
        return {
          ...column,
          Cell: ({ cell }: { cell: MRT_Cell<EntityData, unknown> }) => {
            return (
              <span className="cursor-pointer underline text-blue-500" onClick={handleClick} onKeyDown={handleKeyDown}>
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
