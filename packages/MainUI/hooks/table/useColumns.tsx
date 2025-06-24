import { useCallback, useMemo } from "react";
import { parseColumns } from "@/utils/tableColumns";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import { getFieldReference } from "@/utils";
import { useRouter, usePathname } from "next/navigation";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

export const useColumns = (tab: Tab) => {
  const router = useRouter();
  const pathname = usePathname();
  const { openWindow, buildURL } = useMultiWindowURL();

  const handleAction = useCallback(
    (windowId: string | undefined) => {
      if (!windowId) {
        console.warn("No windowId found");
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      if (isInWindowRoute) {
        openWindow(windowId);
      } else {
        const newWindow = {
          windowId,
          isActive: true,
          title: "",
          selectedRecords: {},
          tabFormStates: {},
        };

        const targetURL = buildURL([newWindow]);

        router.push(targetURL);
      }
    },
    [router, pathname, buildURL, openWindow]
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
