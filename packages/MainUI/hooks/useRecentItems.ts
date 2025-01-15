import { RecentItem } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { UseRecentItemsReturn } from '@workspaceui/componentlibrary/src/hooks/types';
import { useLocalStorage } from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from './useLanguage';

export function useRecentItems(
  recentItems: RecentItem[],
  onClick: (path: string) => void,
  onWindowAccess: (item: RecentItem) => void,
): UseRecentItemsReturn {
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

  const handleItemClick = useCallback(
    (path: string) => {
      const windowId = path.split('/').pop();
      if (windowId) {
        const item = localRecentItems.find(item => item.windowId === windowId);
        if (item) {
          onWindowAccess(item);
          setIsExpanded(true);
        }
      }
      onClick(path);
    },
    [localRecentItems, onWindowAccess, onClick],
  );

  const handleToggleExpand = useCallback(() => {
    hasManuallyToggled.current = true;
    setIsExpanded(prev => !prev);
  }, []);

  const resetManualToggle = useCallback(() => {
    hasManuallyToggled.current = false;
  }, []);

  return {
    localRecentItems,
    isExpanded,
    setIsExpanded,
    handleItemClick,
    handleToggleExpand,
    hasItems: localRecentItems.length > 0,
    resetManualToggle,
  };
}
