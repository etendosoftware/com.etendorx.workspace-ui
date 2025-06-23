import type { Menu } from "@workspaceui/api-client/src/api/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useItemActions } from "../../../hooks/useItemType";
import { CustomClickAwayListener } from "../../../utils/clickAway";
import { findActive } from "../../../utils/drawerUtils";
import { MenuTitle } from "../MenuTitle";
import type { DrawerSectionProps, ToggleFunctions } from "../types";

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
    isExpanded: externalExpanded,
    parentId,
  }) => {
    const isSelected = Boolean(windowId?.length && item.windowId === windowId);
    const [popperOpen, setPopperOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const toggleFunctions = useRef<ToggleFunctions>({});
    const popperRef = useRef<HTMLDivElement>(null);

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

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (!open) {
          setPopperOpen((prev) => !prev);
        } else if (hasChildren && isExpandable) {
          const newExpandedState = !expanded;
          setLocalExpanded(newExpandedState);
          if (parentId) {
            handleNestedToggle(item.id);
          }
          onToggleExpand();
        } else {
          handleItemClick(item);
        }
      },
      [open, hasChildren, isExpandable, expanded, parentId, onToggleExpand, handleNestedToggle, item, handleItemClick]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          handleClick(event as unknown as React.MouseEvent<HTMLElement>);
        }
      },
      [handleClick]
    );

    const handleClose = useCallback(() => {
      setPopperOpen(false);
    }, []);

    const handleClickAndClose = useCallback(
      (item: Menu) => {
        onClick(item);
        handleClose();
      },
      [handleClose, onClick]
    );

    const sectionClasses = [
      expanded && open ? "bg-(--color-dynamic-contrast-text)" : "bg-transparent",
      open ? "m-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" : "flex justify-center p-1",
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
      if (open) {
        setPopperOpen(false);
      }
    }, [open]);

    return (
      <div className={sectionClasses} aria-expanded={expanded} onKeyDown={handleKeyDown}>
        <MenuTitle
          item={item}
          onClick={handleClick}
          selected={isSelected}
          expanded={shouldShowChildren}
          open={open}
          isExpandable={isExpandable && !isSearchActive}
        />
        {hasChildren && open && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out 
              ${shouldShowChildren ? "max-h-[1000px] opacity-100 transform translate-y-0" : "max-h-0 opacity-0 transform -translate-y-2"}`}>
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
        {!open && popperOpen && (
          <div
            ref={popperRef}
            className={`
              fixed bg-white z-50 ml-2 rounded-xl shadow-lg
              transition-all duration-1000 ease-out origin-left
              ${popperOpen ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none -translate-x-2"}`}
            style={{
              left: "3.5rem",
              top: popperRef.current ? popperRef.current.getBoundingClientRect().top : "auto",
            }}>
            <CustomClickAwayListener onClickAway={handleClose}>
              <div className="p-2 min-w-[240px]">
                <MenuTitle
                  item={item}
                  onClick={handleClick}
                  selected={isSelected}
                  expanded={shouldShowChildren}
                  open={true}
                  isExpandable={isExpandable && !isSearchActive}
                  popperOpen={true}
                />

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
              </div>
            </CustomClickAwayListener>
          </div>
        )}
      </div>
    );
  }
);

DrawerSection.displayName = "DrawerSection";

export default DrawerSection;
