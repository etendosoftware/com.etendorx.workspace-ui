import { RecentItem } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLocalStorage } from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { findItemByIdentifier } from '@workspaceui/componentlibrary/src/utils/menuUtils';

const getItemName = (menuItem: Menu, getTranslatedName?: (item: Menu) => string): string => {
  return getTranslatedName?.(menuItem) ?? menuItem._identifier ?? menuItem.name ?? '';
};

const createRecentItem = (item: Menu, getTranslatedName?: (item: Menu) => string): RecentItem => ({
  id: item.id,
  name: getItemName(item, getTranslatedName),
  windowId: item.type === 'Window' ? item.windowId! : item.id,
  type: item.type ?? 'Window',
});

const updateItemsWithTranslations = (
  items: RecentItem[],
  menuItems: Menu[],
  getTranslatedName?: (item: Menu) => string,
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
  getTranslatedName?: (item: Menu) => string,
) {
  const [localRecentItems, setLocalRecentItems] = useLocalStorage<Record<string, RecentItem[]>>(
    'recentlyViewedItems',
    {},
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
    [roleId, localRecentItems, getTranslatedName, setLocalRecentItems],
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
    [roleId, getTranslatedName, setLocalRecentItems],
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
    [addRecentItem, menuItems, onClick, roleId],
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
