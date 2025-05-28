import { forwardRef, useCallback, useImperativeHandle, useEffect, useMemo } from 'react';
import { DrawerSection } from '@workspaceui/componentlibrary/src/components/Drawer/DrawerSection';
import { RecentlyViewedProps } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { createParentMenuItem } from '@workspaceui/componentlibrary/src/utils/menuUtils';
import { useRecentItems } from '../../../hooks/useRecentItems';
import { useTranslation } from '../../../hooks/useTranslation';
import { useUserContext } from '../../../hooks/useUserContext';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLanguage } from '@/contexts/language';

export const RecentlyViewed = forwardRef<{ handleWindowAccess: (item: Menu) => void }, RecentlyViewedProps>(
  ({ windowId, onClick, open, items, getTranslatedName }, ref) => {
    const { t } = useTranslation();
    const { currentRole } = useUserContext();
    const { language } = useLanguage();

    const {
      localRecentItems,
      isExpanded,
      handleRecentItemClick,
      handleToggleExpand,
      hasItems,
      addRecentItem,
      updateTranslations,
    } = useRecentItems(items, onClick, currentRole?.id ?? "", getTranslatedName);

    useEffect(() => {
      if (currentRole?.id && items.length > 0) {
        updateTranslations(items);
      }
    }, [language, items, currentRole?.id, updateTranslations]);

    const handleWindowAccess = useCallback(
      (item: Menu) => {
        if (item.id && item.type) {
          addRecentItem(item);
          return;
        }
      },
      [addRecentItem],
    );

    useImperativeHandle(
      ref,
      () => ({
        handleWindowAccess,
      }),
      [handleWindowAccess],
    );

    const parentMenuItem = useMemo(() => createParentMenuItem(localRecentItems, t), [localRecentItems, t]);

    if (!currentRole?.id) return null;

    return (
      <DrawerSection
        item={parentMenuItem}
        onClick={handleRecentItemClick}
        open={open}
        hasChildren={hasItems}
        isExpandable={hasItems}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        isSearchActive={false}
        parentId=""
        windowId={windowId}
      />
    );
  },
);

RecentlyViewed.displayName = 'RecentlyViewed';

export default RecentlyViewed;
