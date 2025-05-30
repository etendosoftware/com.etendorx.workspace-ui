import React, { useRef } from "react";
import DrawerSection from "../DrawerSection";
import type { DrawerItemsProps, ToggleFunctions } from "../types";

export const DrawerItems: React.FC<DrawerItemsProps> = React.memo(
  ({
    items,
    onClick,
    open,
    expandedItems,
    toggleItemExpansion,
    searchValue,
    windowId,
    onReportClick,
    onProcessClick,
  }) => {
    const toggleFunctions = useRef<ToggleFunctions>({});

    return (
      <>
        {Array.isArray(items)
          ? items.map((item) => {
              if (!toggleFunctions.current[item.id]) {
                toggleFunctions.current[item.id] = () => toggleItemExpansion(item.id);
              }
              return (
                <DrawerSection
                  key={item.id}
                  item={item}
                  onClick={onClick}
                  onReportClick={onReportClick}
                  onProcessClick={onProcessClick}
                  open={open}
                  isExpanded={expandedItems.has(item.id) || Boolean(searchValue)}
                  onToggleExpand={toggleFunctions.current[item.id]}
                  hasChildren={Array.isArray(item.children) && item.children.length > 0}
                  isExpandable={!searchValue && Array.isArray(item.children) && item.children.length > 0}
                  isSearchActive={Boolean(searchValue)}
                  windowId={windowId}
                />
              );
            })
          : null}
      </>
    );
  },
);

export default DrawerItems;
