import DrawerSection from '../DrawerSection';
import { RecentlyViewedProps } from '../types';
import { useRecentItems } from '@workspaceui/componentlibrary/src/hooks/useRecentItems';
import { createParentMenuItem } from '@workspaceui/componentlibrary/src/utils/menuUtils';

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ onClick, open, onWindowAccess, recentItems }) => {
  const { localRecentItems, isExpanded, handleItemClick, handleToggleExpand, hasItems } = useRecentItems(
    recentItems,
    onClick,
    onWindowAccess,
  );

  const parentMenuItem = createParentMenuItem(localRecentItems);

  return (
    <DrawerSection
      item={parentMenuItem}
      onClick={handleItemClick}
      open={open}
      hasChildren={hasItems}
      isExpandable={hasItems}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      isSearchActive={false}
      parentId=""
    />
  );
};

export default RecentlyViewed;
