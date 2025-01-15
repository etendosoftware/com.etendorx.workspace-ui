import { RecentItem } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLocalStorage } from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from './useLanguage';

export function useRecentItems(
  recentItems: RecentItem[],
  handleItemClick: (item: Menu) => void,
  onWindowAccess: (item: RecentItem) => void,
) {
  const [localRecentItems, setLocalRecentItems] = useLocalStorage<RecentItem[]>('recentlyViewedItems', []);
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  const hasManuallyToggled = useRef(false);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current && localRecentItems.length > 0) {
      setIsExpanded(true);
      isFirstLoad.current = false;
    }
  }, [localRecentItems]);

  useEffect(() => {
    if (recentItems.length > 0) {
      setLocalRecentItems(recentItems);
      if (!hasManuallyToggled.current) {
        setIsExpanded(true);
      }
    }
  }, [recentItems, setLocalRecentItems, language]);

  const handleRecentItemClick = useCallback(
    (path: string) => {
      const windowId = path.split('/').pop();
      if (windowId) {
        const recentItem = localRecentItems.find(item => item.windowId === windowId);
        if (recentItem) {
          onWindowAccess(recentItem);
          const menuItem: Menu = {
            ...recentItem,
            id: recentItem.id,
            name: recentItem.name,
            windowId: recentItem.windowId,
            type: recentItem.type || 'Window',
            action: 'W',
          };
          handleItemClick(menuItem);
          setIsExpanded(true);
        }
      }
    },
    [localRecentItems, onWindowAccess, handleItemClick],
  );

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded(prev => !prev);
  }, []);

  return {
    localRecentItems,
    isExpanded,
    setIsExpanded,
    handleRecentItemClick,
    handleToggleExpand,
    hasItems: localRecentItems.length > 0,
  };
}
