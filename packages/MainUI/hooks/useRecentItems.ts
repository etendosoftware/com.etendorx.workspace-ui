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
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { findItemByIdentifier } from "@workspaceui/componentlibrary/src/utils/menuUtils";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
    const menuItem = findItemByIdentifier(menuItems, storedItem.windowId);
    if (!menuItem) return storedItem;

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
  const [localRecentItems, setLocalRecentItems] = useLocalStorage<Record<string, RecentItem[]>>(
    "recentlyViewedItems",
    {}
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const hasManuallyToggled = useRef(false);
  const isFirstLoad = useRef(true);
  const previousItems = useRef<RecentItem[]>([]);

  const updateTranslations = useCallback(
    (items: Menu[]) => {
      if (!roleId) return;
      const currentItems = localRecentItems[roleId] || [];
      if (!currentItems.length) return;

      const updatedItems = updateItemsWithTranslations(currentItems, items, getTranslatedName);
      const hasChanges = JSON.stringify(updatedItems) !== JSON.stringify(currentItems);

      if (hasChanges) {
        setLocalRecentItems((prev) => ({ ...prev, [roleId]: updatedItems }));
      }
    },
    [roleId, localRecentItems, getTranslatedName, setLocalRecentItems]
  );

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded((prev) => !prev);
  }, []);

  const addRecentItem = useCallback(
    (item: Menu) => {
      const recentItem = createRecentItem(item, getTranslatedName);
      setLocalRecentItems((prev) => {
        const currentItems = prev[roleId] || [];
        const existing = currentItems.find((v) => v.id === item.id);

        if (existing) {
          const newItems = { ...prev };
          newItems[roleId] = [existing, ...newItems[roleId].filter((v) => v.id !== item.id)];

          return newItems;
        }

        const newItems = [recentItem, ...currentItems.filter((i) => i.id !== recentItem.id)].slice(0, 5);

        const hasChanges = JSON.stringify(newItems) !== JSON.stringify(currentItems);
        if (!hasChanges) return prev;

        return { ...prev, [roleId]: newItems };
      });

      return recentItem;
    },
    [roleId, getTranslatedName, setLocalRecentItems]
  );

  const handleRecentItemClick = useCallback(
    (item: Menu) => {
      onClick(item);

      const itemId = item.id;
      if (!itemId || !roleId) return;

      const menuItem = findItemByIdentifier(menuItems, itemId);
      if (!menuItem) return;

      addRecentItem(item);
      setIsExpanded(true);
    },
    [addRecentItem, menuItems, onClick, roleId]
  );

  useEffect(() => {
    if (!roleId) return;
    const currentItems = localRecentItems[roleId] || [];
    if (!currentItems.length) return;

    const hasNewItems = currentItems.some((item, index) => {
      const prevItem = previousItems.current[index];
      return !prevItem || item.windowId !== prevItem.windowId;
    });

    if (!hasNewItems) return;

    const updatedItems = updateItemsWithTranslations(currentItems, menuItems, getTranslatedName);
    previousItems.current = updatedItems;

    const hasChanges = JSON.stringify(updatedItems) !== JSON.stringify(currentItems);
    if (hasChanges) {
      setLocalRecentItems((prev) => ({ ...prev, [roleId]: updatedItems }));
    }
  }, [menuItems, roleId, getTranslatedName, localRecentItems, setLocalRecentItems]);

  useEffect(() => {
    if (isFirstLoad.current && roleId && localRecentItems[roleId]?.length) {
      setIsExpanded(true);
      isFirstLoad.current = false;
    }
  }, [roleId, localRecentItems]);

  return {
    localRecentItems: roleId ? localRecentItems[roleId] || [] : [],
    isExpanded,
    setIsExpanded,
    handleRecentItemClick,
    handleToggleExpand,
    hasItems: Boolean(roleId && localRecentItems[roleId]?.length),
    addRecentItem,
    updateTranslations,
  };
}
