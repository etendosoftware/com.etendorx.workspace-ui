import { forwardRef, useCallback, useImperativeHandle, useEffect, useMemo } from 'react';
import DrawerSection from '@workspaceui/componentlibrary/src/components/Drawer/DrawerSection';
import { RecentlyViewedProps } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { createParentMenuItem, findItemByIdentifier } from '@workspaceui/componentlibrary/src/utils/menuUtils';
import { useRecentItems } from '../../../hooks/useRecentItems';
import { useTranslation } from '../../../hooks/useTranslation';
import { useItemActions } from '@workspaceui/componentlibrary/src/hooks/useItemType';
import { useUserContext } from '../../../hooks/useUserContext';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useLanguage } from '@/contexts/language';

const RecentlyViewed = forwardRef<{ handleWindowAccess: (item: Menu) => void }, RecentlyViewedProps>(
  ({ windowId, onClick, open, items, getTranslatedName }, ref) => {
    const { t } = useTranslation();
    const { currentRole } = useUserContext();
    const { language } = useLanguage();

    const handleItemClick = useItemActions({
      onWindowClick: (windowId: string) => onClick(windowId),
      onReportClick: (reportId: string) => onClick(`/report/${reportId}`),
      onProcessClick: (processId: string) => onClick(`/process/${processId}`),
    });

    const {
      localRecentItems,
      isExpanded,
      handleRecentItemClick,
      handleToggleExpand,
      hasItems,
      addRecentItem,
      updateTranslations,
    } = useRecentItems(items, handleItemClick, onClick, currentRole?.id, getTranslatedName);

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

        const menuItem = findItemByIdentifier(items, item.id);
        if (menuItem) {
          addRecentItem(menuItem);
        }
      },
      [items, addRecentItem],
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
