import { RecentItem } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLocalStorage } from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { findItemByIdentifier } from '@workspaceui/componentlibrary/src/utils/menuUtils';

export function useRecentItems(
  menuItems: Menu[],
  handleItemClick: (item: Menu) => void,
  onClick: (path: string) => void,
  roleId?: string,
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

      const updatedItems = currentItems.map(storedItem => {
        const menuItem = findItemByIdentifier(items, storedItem.windowId);
        if (!menuItem) return storedItem;

        return {
          ...storedItem,
          name: getTranslatedName?.(menuItem) ?? menuItem._identifier ?? menuItem.name ?? storedItem.name,
        };
      });

      if (JSON.stringify(updatedItems) !== JSON.stringify(currentItems)) {
        setLocalRecentItems(prev => ({
          ...prev,
          [roleId]: updatedItems,
        }));
      }
    },
    [roleId, localRecentItems, getTranslatedName, setLocalRecentItems],
  );

  useEffect(() => {
    if (!roleId) return;

    const currentItems = localRecentItems[roleId] || [];
    if (!currentItems.length) return;

    const needsUpdate = currentItems.some((item, index) => {
      const prevItem = previousItems.current[index];
      return !prevItem || item.windowId !== prevItem.windowId;
    });

    if (!needsUpdate) return;

    const updatedItems = currentItems.map(storedItem => {
      const menuItem = findItemByIdentifier(menuItems, storedItem.windowId);
      if (!menuItem) return storedItem;

      return {
        ...storedItem,
        name: getTranslatedName?.(menuItem) ?? menuItem._identifier ?? menuItem.name ?? storedItem.name,
      };
    });

    previousItems.current = updatedItems;

    if (JSON.stringify(updatedItems) !== JSON.stringify(currentItems)) {
      setLocalRecentItems(prev => ({
        ...prev,
        [roleId]: updatedItems,
      }));
    }
  }, [menuItems, roleId, getTranslatedName, localRecentItems, setLocalRecentItems]);

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded(prev => !prev);
  }, []);

  const addRecentItem = useCallback(
    (item: Menu) => {
      if (!roleId) {
        return null;
      }

      const recentItem: RecentItem = {
        id: item.id,
        name: getTranslatedName?.(item) ?? item._identifier ?? item.name ?? '',
        windowId: item.type === 'Window' ? item.windowId! : item.id,
        type: item.type ?? 'Window',
      };

      setLocalRecentItems(prev => {
        const currentItems = prev[roleId] || [];
        const newItems = [recentItem, ...currentItems.filter(i => i.id !== recentItem.id)].slice(0, 5);

        if (JSON.stringify(newItems) === JSON.stringify(currentItems)) {
          return prev;
        }

        return {
          ...prev,
          [roleId]: newItems,
        };
      });

      return recentItem;
    },
    [roleId, getTranslatedName, setLocalRecentItems],
  );

  const handleRecentItemClick = useCallback(
    (path: string) => {
      const itemId = path.split('/').pop();
      if (!itemId || !roleId) return;

      const menuItem = findItemByIdentifier(menuItems, itemId);
      if (!menuItem) return;

      const recentItem = addRecentItem(menuItem);
      if (recentItem) {
        onClick(path);
        handleItemClick(menuItem);
        setIsExpanded(true);
      }
    },
    [roleId, menuItems, addRecentItem, onClick, handleItemClick],
  );

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
