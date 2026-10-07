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

import type { RecentItem } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { findItemByIdentifier } from "@workspaceui/componentlibrary/src/utils/menuUtils";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecentItemsStore } from "@/stores/recentItemsStore";

const getItemName = (menuItem: Menu, getTranslatedName?: (item: Menu) => string): string => {
  return getTranslatedName?.(menuItem) ?? menuItem._identifier ?? menuItem.name ?? "";
};

const createRecentItem = (
  item: Menu & Record<string, any>,
  getTranslatedName?: (item: Menu) => string
): RecentItem & Record<string, any> => ({
  id: item.id,
  name: getItemName(item, getTranslatedName),
  windowId: item.type === "Window" ? (item.windowId ?? item.id) : item.id,
  type: item.type ?? "Window",
  // Store these IDs if they exist so they're available when restoring from cache
  processId: item.processId,
  processDefinitionId: item.processDefinitionId,
  processUrl: item.processUrl,
  isModalProcess: item.isModalProcess,
});

const updateItemsWithTranslations = (
  items: RecentItem[],
  menuItems: Menu[],
  getTranslatedName?: (item: Menu) => string
): RecentItem[] => {
  return items.map((storedItem) => {
    // For Window items use windowId as lookup key; for Process/Report/etc. use id.
    // This prevents a Window with the same windowId as a Process's id from overwriting the name.
    const lookupId = storedItem.type === "Window" ? storedItem.windowId : storedItem.id;
    const menuItem = findItemByIdentifier(menuItems, lookupId);
    if (menuItem?.type !== storedItem.type) return storedItem;

    return {
      ...storedItem,
      name: getItemName(menuItem, getTranslatedName),
    };
  });
};

export function useRecentItems(
  menuItems: Menu[],
  onClick: (item: Menu) => void,
  roleId: string,
  getTranslatedName?: (item: Menu) => string
) {
  // The list is already scoped to the current user + role + organization by RecentItemsProvider.
  const recentItems = useRecentItemsStore((s) => s.items);
  const addToRecentItems = useRecentItemsStore((s) => s.add);
  const setRecentItems = useRecentItemsStore((s) => s.setItems);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasManuallyToggled = useRef(false);
  const isFirstLoad = useRef(true);
  const previousItems = useRef<RecentItem[]>([]);

  const updateTranslations = useCallback(
    (items: Menu[]) => {
      if (!roleId || !recentItems.length) return;

      const updatedItems = updateItemsWithTranslations(recentItems, items, getTranslatedName);
      const hasChanges = JSON.stringify(updatedItems) !== JSON.stringify(recentItems);

      if (hasChanges) {
        setRecentItems(updatedItems);
      }
    },
    [roleId, recentItems, getTranslatedName, setRecentItems]
  );

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded((prev) => !prev);
  }, []);

  const addRecentItem = useCallback(
    (item: Menu) => {
      // The fresh entry replaces any stale one so name/type are updated on re-access.
      const recentItem = createRecentItem(item, getTranslatedName);
      addToRecentItems(recentItem);

      return recentItem;
    },
    [getTranslatedName, addToRecentItems]
  );

  const handleRecentItemClick = useCallback(
    (item: Menu) => {
      const itemId = item.id;
      // findItemByIdentifier matches Window items by windowId, not by menu item id.
      // For non-Window types (Process, Report) it matches by id.
      const lookupId = item.type === "Window" ? (item.windowId ?? item.id) : item.id;
      const menuItem = lookupId ? findItemByIdentifier(menuItems, lookupId) : null;

      // Validate type match: a Window with the same windowId as a Process's id must not
      // be used to navigate — it would open the wrong item (e.g. BP Category instead of Generate Invoices).
      const validMenuItem = menuItem?.type === item.type ? menuItem : null;

      // Use the full menu item when available and type-valid, falling back to the stored item.
      onClick(validMenuItem ?? item);

      if (!itemId || !roleId) return;
      if (!validMenuItem) return;

      addRecentItem(validMenuItem);
    },
    [addRecentItem, menuItems, onClick, roleId]
  );

  useEffect(() => {
    if (!roleId || !recentItems.length) return;

    const hasNewItems = recentItems.some((item, index) => {
      const prevItem = previousItems.current[index];
      return !prevItem || item.windowId !== prevItem.windowId;
    });

    if (!hasNewItems) return;

    const updatedItems = updateItemsWithTranslations(recentItems, menuItems, getTranslatedName);
    previousItems.current = updatedItems;

    const hasChanges = JSON.stringify(updatedItems) !== JSON.stringify(recentItems);
    if (hasChanges) {
      setRecentItems(updatedItems);
    }
  }, [menuItems, roleId, getTranslatedName, recentItems, setRecentItems]);

  useEffect(() => {
    if (isFirstLoad.current && roleId && recentItems.length) {
      setIsExpanded(true);
      isFirstLoad.current = false;
    }
  }, [roleId, recentItems]);

  return {
    localRecentItems: roleId ? recentItems : [],
    isExpanded,
    setIsExpanded,
    handleRecentItemClick,
    handleToggleExpand,
    hasItems: Boolean(roleId && recentItems.length),
    addRecentItem,
    updateTranslations,
  };
}
