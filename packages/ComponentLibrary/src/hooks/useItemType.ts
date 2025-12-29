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

import { useCallback } from "react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import type { UseItemActionsProps } from "./types";

export const useItemActions = ({ onWindowClick, onReportClick, onProcessClick }: UseItemActionsProps) => {
  const handleItemClick = useCallback(
    (item: Menu) => {
      const validType = ["Window", "Report", "ProcessDefinition", "Form", "Process", "ProcessManual"].includes(
        item.type || ""
      );
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
        case "ProcessManual":
        case "ProcessDefinition":
        case "Form":
        case "Process":
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
