import { RecentItem } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLocalStorage } from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from './useLanguage';

export function useRecentItems(
  recentItems: RecentItem[],
  handleItemClick: (item: Menu) => void,
  onWindowAccess: (item: RecentItem) => void,
  role?: string,
) {
  const [localRecentItems, setLocalRecentItems] = useLocalStorage<Record<string, RecentItem[]>>(
    'recentlyViewedItems',
    {},
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { language } = useLanguage();
  const hasManuallyToggled = useRef(false);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current && role && localRecentItems[role]?.length > 0) {
      setIsExpanded(true);
      isFirstLoad.current = false;
    }
  }, [localRecentItems, role, language]);

  useEffect(() => {
    if (recentItems.length > 0 && role) {
      setLocalRecentItems(prev => ({ ...prev, [role]: recentItems }));
      if (!hasManuallyToggled.current) {
        setIsExpanded(true);
      }
    }
  }, [recentItems, role, setLocalRecentItems]);

  const handleRecentItemClick = useCallback(
    (path: string) => {
      const windowId = path.split('/').pop();
      if (windowId && role) {
        const recentItem = localRecentItems[role].find(item => item.windowId === windowId);
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
    [role, localRecentItems, onWindowAccess, handleItemClick],
  );

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded(prev => !prev);
  }, []);

  return {
    localRecentItems: role ? localRecentItems[role] : [],
    isExpanded,
    setIsExpanded,
    handleRecentItemClick,
    handleToggleExpand,
    hasItems: role && localRecentItems[role]?.length > 0,
  };
}
