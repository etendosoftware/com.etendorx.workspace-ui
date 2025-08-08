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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useItemActions } from "../../../hooks/useItemType";
import { findActive } from "../../../utils/drawerUtils";
import { MenuTitle } from "../MenuTitle";
import type { DrawerSectionProps, ToggleFunctions } from "../types";
import MenuLibrary from "../../Menu";

export const DrawerSection: React.FC<DrawerSectionProps> = React.memo(
  ({
    item,
    onClick,
    open,
    isSearchActive,
    onToggleExpand,
    hasChildren,
    isExpandable,
    windowId,
    pendingWindowId,
    isExpanded: externalExpanded,
    parentId,
  }) => {
    const targetWindowId = windowId || pendingWindowId;
    const isSelected = Boolean(targetWindowId?.length && item.windowId === targetWindowId);
    const hasActiveChild = !isSelected && Boolean(targetWindowId?.length && findActive(targetWindowId, item.children));
    const isParentActive = isSelected || hasActiveChild;
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const toggleFunctions = useRef<ToggleFunctions>({});
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const menuControlRef = useRef<{ recalculatePosition: () => void } | null>(null);

    const [localExpanded, setLocalExpanded] = useState(isSelected || findActive(windowId, item.children));

    const expanded = Boolean(externalExpanded || localExpanded);

    const onWindowClick = useCallback((item: Menu) => onClick(item), [onClick]);
    const onReportClick = useCallback((item: Menu) => onClick(item), [onClick]);
    const onProcessClick = useCallback((item: Menu) => onClick(item), [onClick]);

    const handleItemClick = useItemActions({
      onWindowClick,
      onReportClick,
      onProcessClick,
    });

    const handleNestedToggle = useCallback((sectionId: string) => {
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
          newSet.delete(sectionId);
        } else {
          newSet.add(sectionId);
        }

        setTimeout(() => {
          if (menuControlRef.current) {
            menuControlRef.current.recalculatePosition();
          }
        }, 100);

        return newSet;
      });
    }, []);

    const getToggleFunction = useCallback(
      (sectionId: string) => {
        if (!toggleFunctions.current[sectionId]) {
          toggleFunctions.current[sectionId] = () => handleNestedToggle(sectionId);
        }
        return toggleFunctions.current[sectionId];
      },
      [handleNestedToggle]
    );

    const handleClick = useCallback(() => {
      if (open) {
        if (hasChildren && isExpandable) {
          const newExpandedState = !expanded;
          setLocalExpanded(newExpandedState);
          if (parentId) {
            handleNestedToggle(item.id);
          }

          onToggleExpand();
        } else {
          handleItemClick(item);
        }
      } else {
        if (!hasChildren) {
          handleItemClick(item);
        }
      }
    }, [
      open,
      hasChildren,
      isExpandable,
      expanded,
      parentId,
      onToggleExpand,
      handleNestedToggle,
      item,
      handleItemClick,
    ]);

    const handleMouseEnter = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        if (!open && hasChildren) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setAnchorEl(event.currentTarget);
        }
      },
      [open, hasChildren]
    );

    const handleMouseLeave = useCallback(() => {
      if (!open) {
        hoverTimeoutRef.current = setTimeout(() => {
          setAnchorEl(null);
        }, 150);
      }
    }, [open]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          handleClick();
        }
      },
      [handleClick]
    );

    const sectionClasses = [
      expanded && open ? "bg-(--color-baseline-10)" : "bg-transparent ",
      open ? "m-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" : "flex justify-center",
      !open && hasActiveChild ? "bg-dynamic-main rounded-full" : "",
    ].join(" ");

    const shouldShowChildren = isSearchActive || expanded;

    useEffect(() => {
      if (isSelected || findActive(windowId, item.children)) {
        setLocalExpanded(true);
        if (parentId) {
          handleNestedToggle(item.id);
        }
      }
    }, [isSelected, item.children, windowId, parentId, item.id, handleNestedToggle]);

    useEffect(() => {
      if (item.id === "recently-viewed" && !isSelected && !findActive(windowId, item.children)) {
        setLocalExpanded(false);
      }
    }, [item.id, isSelected, windowId, item.children]);

    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

    const handleCloseMenu = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleClickAndClose = useCallback(
      (item: Menu) => {
        onClick(item);
        handleCloseMenu();
      },
      [handleCloseMenu, onClick]
    );

    return (
      <div
        className={sectionClasses}
        aria-expanded={expanded}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <MenuTitle
          item={item}
          onClick={handleClick}
          selected={isSelected}
          expanded={shouldShowChildren}
          open={open}
          isParentActive={isParentActive}
          isExpandable={isExpandable && !isSearchActive}
        />
        {hasChildren && open && (
          <div
            className={`transition-all duration-300 ease-in-out h-auto 
              ${shouldShowChildren ? "opacity-100" : "max-h-0 overflow-hidden"}`}>
            {item.children?.map((subitem) => (
              <DrawerSection
                key={subitem.id}
                item={subitem}
                onClick={onClick}
                open={open}
                isSearchActive={isSearchActive}
                onToggleExpand={getToggleFunction(subitem.id)}
                hasChildren={Boolean(subitem.children?.length)}
                isExpandable={isExpandable && !isSearchActive}
                isExpanded={expandedSections.has(subitem.id)}
                parentId={item.id}
                windowId={windowId}
              />
            ))}
          </div>
        )}
        {!open && anchorEl && (
          <div
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleMouseLeave}>
            <MenuLibrary
              className="max-h-76 w-full max-w-60 overflow-y-scroll hide-scrollbar"
              anchorEl={anchorEl}
              offsetX={62}
              offsetY={-98}
              onClose={handleCloseMenu}
              menuRef={menuControlRef}>
              <div
                className="h-13 border-b border-transparent-neutral-5 flex items-center px-4 bg-neutral-50 
                  font-inter font-semibold text-[14px] leading-[20px] tracking-[0.15px] text-baseline-80">
                {item.name}
              </div>
              {item.children?.map((subitem) => (
                <DrawerSection
                  key={subitem.id}
                  item={subitem}
                  onClick={handleClickAndClose}
                  open={true}
                  isSearchActive={isSearchActive}
                  onToggleExpand={getToggleFunction(subitem.id)}
                  hasChildren={Boolean(subitem.children?.length)}
                  isExpandable={isExpandable && !isSearchActive}
                  isExpanded={expandedSections.has(subitem.id)}
                  parentId={item.id}
                  windowId={windowId}
                />
              ))}
            </MenuLibrary>
          </div>
        )}
      </div>
    );
  }
);

DrawerSection.displayName = "DrawerSection";

export default DrawerSection;
