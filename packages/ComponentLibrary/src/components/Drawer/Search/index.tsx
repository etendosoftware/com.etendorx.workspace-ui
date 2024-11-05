import React, { useRef } from 'react';
import DrawerSection from '../DrawerSection';
import { DrawerItemsProps } from '../types';

const DrawerItems: React.FC<DrawerItemsProps> = ({
  items,
  onClick,
  open,
  expandedItems,
  toggleItemExpansion,
  searchValue,
  windowId,
}) => {
  const refs = useRef<Record<string, () => unknown>>({});

  return (
    <>
      {items.map(item => {
        refs.current[item.id] = refs.current[item.id] ? refs.current[item.id] : () => toggleItemExpansion(item.id);

        return (
          <React.Fragment key={item.id}>
            <DrawerSection
              item={item}
              onClick={onClick}
              open={open}
              isExpanded={expandedItems.has(item.id) || Boolean(searchValue)}
              onToggleExpand={refs.current[item.id]}
              hasChildren={Array.isArray(item.children) && item.children.length > 0}
              isExpandable={!searchValue && Array.isArray(item.children) && item.children.length > 0}
              isSearchActive={Boolean(searchValue)}
              windowId={windowId}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default DrawerItems;
