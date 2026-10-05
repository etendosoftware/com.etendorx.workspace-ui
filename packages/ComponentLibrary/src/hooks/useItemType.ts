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
import { OPENABLE_MENU_ITEM_TYPES } from "../utils/drawerUtils";

type ItemCallbackName = keyof UseItemActionsProps;

/** Which callback opens an item type, and what the item needs to be opened. */
interface ItemRoute {
  callback: ItemCallbackName;
  canOpen: (item: Menu) => boolean;
}

const hasId = (item: Menu): boolean => Boolean(item.id);

const PROCESS_ROUTE: ItemRoute = { callback: "onProcessClick", canOpen: hasId };

type OpenableMenuItemType = (typeof OPENABLE_MENU_ITEM_TYPES)[number];

/** Typed over OPENABLE_MENU_ITEM_TYPES, so both lists can never drift apart. */
const ITEM_ROUTES: Record<OpenableMenuItemType, ItemRoute> = {
  Window: { callback: "onWindowClick", canOpen: (item) => Boolean(item.windowId) },
  View: { callback: "onWindowClick", canOpen: () => true },
  Report: { callback: "onReportClick", canOpen: hasId },
  ProcessManual: PROCESS_ROUTE,
  ProcessDefinition: PROCESS_ROUTE,
  Form: PROCESS_ROUTE,
  Process: PROCESS_ROUTE,
  External: { callback: "onWindowClick", canOpen: (item) => Boolean(item.url) },
};

const isOpenableMenuItemType = (type: string): type is OpenableMenuItemType =>
  OPENABLE_MENU_ITEM_TYPES.includes(type as OpenableMenuItemType);

/** The route that opens the item, or undefined when the drawer cannot open its type. */
const getItemRoute = (item: Menu): ItemRoute | undefined => {
  const type = item.type ?? "";
  if (!isOpenableMenuItemType(type)) return undefined;
  return ITEM_ROUTES[type];
};

export const useItemActions = ({ onWindowClick, onReportClick, onProcessClick }: UseItemActionsProps) => {
  const handleItemClick = useCallback(
    (item: Menu) => {
      const route = getItemRoute(item);
      if (!route) {
        console.warn(`Invalid item type: ${item.type}, defaulting to Window`);
        return;
      }
      if (!route.canOpen(item)) return;

      const callback = { onWindowClick, onReportClick, onProcessClick }[route.callback];
      callback?.(item);
    },
    [onWindowClick, onReportClick, onProcessClick]
  );

  return handleItemClick;
};
