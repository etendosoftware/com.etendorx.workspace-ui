import DrawerSection from '../DrawerSection';
import { RecentlyViewedProps } from '../types';
import { useRecentItems } from '../../../hooks/useRecentItems';
import { createParentMenuItem } from '../../../utils/menuUtils';

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ windowId, onClick, open, onWindowAccess, recentItems }) => {
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
      windowId={windowId}
    />
  );
};

export default RecentlyViewed;
