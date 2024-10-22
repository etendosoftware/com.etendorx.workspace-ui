import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { RecentItem } from '../components/Drawer/types';

interface UseRecentItemsReturn {
  localRecentItems: RecentItem[];
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  handleItemClick: (path: string) => void;
  handleToggleExpand: () => void;
  hasItems: boolean;
  resetManualToggle: () => void;
}

export function useRecentItems(
  recentItems: RecentItem[],
  onClick: (path: string) => void,
  onWindowAccess: (item: RecentItem) => void,
): UseRecentItemsReturn {
  const [localRecentItems, setLocalRecentItems] = useLocalStorage<RecentItem[]>('recentlyViewedItems', []);
  const [isExpanded, setIsExpanded] = useState(false);

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
  }, [recentItems, setLocalRecentItems]);

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
