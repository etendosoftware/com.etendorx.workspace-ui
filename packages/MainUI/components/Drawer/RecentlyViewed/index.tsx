import DrawerSection from '@workspaceui/componentlibrary/src/components/Drawer/DrawerSection';
import { RecentlyViewedProps } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { createParentMenuItem } from '@workspaceui/componentlibrary/src/utils/menuUtils';
import { useRecentItems } from '../../../hooks/useRecentItems';
import { useTranslation } from '../../../hooks/useTranslation';
import { useMemo } from 'react';
import { useItemActions } from '@workspaceui/componentlibrary/src/hooks/useItemType';
import { useUserContext } from '@/hooks/useUserContext';

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ windowId, onClick, open, onWindowAccess, recentItems }) => {
  const { t } = useTranslation();
  const { currentRole } = useUserContext();

  const handleItemClick = useItemActions({
    onWindowClick: (windowId: string) => onClick(`/window/${windowId}`),
    onReportClick: (reportId: string) => onClick(`/report/${reportId}`),
    onProcessClick: (processId: string) => onClick(`/process/${processId}`),
  });

  const { localRecentItems, isExpanded, handleRecentItemClick, handleToggleExpand, hasItems } = useRecentItems(
    recentItems,
    handleItemClick,
    onWindowAccess,
    currentRole?.id,
  );

  const parentMenuItem = useMemo(() => createParentMenuItem(localRecentItems, t), [localRecentItems, t]);

  return (
    <DrawerSection
      item={parentMenuItem}
      onClick={handleRecentItemClick}
      open={open}
      hasChildren={!!hasItems}
      isExpandable={!!hasItems}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      isSearchActive={false}
      parentId=""
      windowId={windowId}
    />
  );
};

export default RecentlyViewed;
