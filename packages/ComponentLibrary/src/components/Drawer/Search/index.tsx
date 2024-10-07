import React from 'react';
import DrawerSection from '../DrawerSection';
import { Menu } from '../../../../../EtendoHookBinder/src/api/types';
import { DrawerItemsProps } from '../types';

const DrawerItems: React.FC<DrawerItemsProps> = ({
  items,
  onClick,
  open,
  expandedItems,
  toggleItemExpansion,
  searchValue,
}) => {
  const renderItems = (items: Menu[]) => {
    return items.map(item => {
      const isExpanded = expandedItems.has(item.id) || Boolean(searchValue);
      return (
        <React.Fragment key={item.id}>
          <DrawerSection
            item={item}
            onClick={onClick}
            open={open}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleItemExpansion(item.id)}
            hasChildren={Array.isArray(item.children) && item.children.length > 0}
            isExpandable={!searchValue && Array.isArray(item.children) && item.children.length > 0}
            isSearchActive={Boolean(searchValue)}></DrawerSection>
        </React.Fragment>
      );
    });
  };

  return <>{renderItems(items)}</>;
};

export default DrawerItems;
