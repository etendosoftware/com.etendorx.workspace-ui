/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
    pendingWindowId,
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
                  pendingWindowId={pendingWindowId}
                />
              );
            })
          : null}
      </>
    );
  }
);

export default DrawerItems;
