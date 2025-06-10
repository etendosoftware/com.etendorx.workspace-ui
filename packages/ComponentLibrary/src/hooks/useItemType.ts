import { useCallback } from "react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import type { UseItemActionsProps } from "./types";

export const useItemActions = ({ onWindowClick, onReportClick, onProcessClick }: UseItemActionsProps) => {
  const handleItemClick = useCallback(
    (item: Menu) => {
      const validType = ["Window", "Report", "ProcessDefinition"].includes(item.type || "");
      if (!validType) {
        console.warn(`Invalid item type: ${item.type}, defaulting to Window`);
        if (item.windowId && onWindowClick) {
          onWindowClick(item);
        }
        return;
      }

      switch (item.type) {
        case "Window":
          if (item.windowId && onWindowClick) {
            onWindowClick(item);
          }
          break;
        case "Report":
          if (item.id && onReportClick) {
            onReportClick(item);
          }
          break;
        case "ProcessDefinition":
          if (item.id && onProcessClick) {
            onProcessClick(item);
          }
          break;
        default:
          console.warn(`Unhandled item type: ${item.type}`);
      }
    },
    [onWindowClick, onReportClick, onProcessClick]
  );

  return handleItemClick;
};
