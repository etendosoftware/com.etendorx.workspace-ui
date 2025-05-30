import { useLanguage } from "@/contexts/language";
import { DrawerSection } from "@workspaceui/componentlibrary/src/components/Drawer/DrawerSection";
import type { RecentlyViewedProps } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import { createParentMenuItem } from "@workspaceui/componentlibrary/src/utils/menuUtils";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from "react";
import { useRecentItems } from "../../../hooks/useRecentItems";
import { useTranslation } from "../../../hooks/useTranslation";
import { useUserContext } from "../../../hooks/useUserContext";

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
    }, [items, currentRole?.id, updateTranslations]);

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

RecentlyViewed.displayName = "RecentlyViewed";

export default RecentlyViewed;
