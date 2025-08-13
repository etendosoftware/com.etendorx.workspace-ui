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

"use client";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllItemTitles } from "../../utils/searchUtils";
import TextInputAutocomplete from "../Input/TextInput/TextInputAutocomplete";
import DrawerHeader from "./Header";
import { DrawerItems } from "./Search";
import type { DrawerProps } from "./types";
import ResizeHandle from "../ResizeHandle";

const DRAWER_STATE_KEY = "etendo-drawer-open";
interface RecentlyViewedHandler {
  handleWindowAccess?: (item: Menu) => void;
}

const DRAWER_OPEN_WIDTH = 16.25;
const DRAWER_CLOSED_WIDTH = 3.5;
const DRAWER_MAX_WIDTH = 50;

const Drawer: React.FC<DrawerProps> = ({
  windowId,
  pendingWindowId,
  items = [],
  logo,
  title,
  onClick,
  onReportClick,
  onProcessClick,
  RecentlyViewedComponent,
  getTranslatedName,
  searchContext,
}) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(DRAWER_STATE_KEY);
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });
  const [drawerWidth, setDrawerWidth] = useState<number>(DRAWER_OPEN_WIDTH);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const drawerRefs = useRef<{
    recentlyViewedHandler: RecentlyViewedHandler;
  }>({
    recentlyViewedHandler: {},
  });

  const { searchValue, setSearchValue, filteredItems, expandedItems, setExpandedItems, searchIndex } = searchContext;

  useEffect(() => {
    setDrawerWidth(open ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH);
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(open));
    }
  }, [open]);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const allItemTitles = useMemo(() => (searchIndex ? getAllItemTitles(searchIndex) : []), [searchIndex]);

  const handleHeaderClick = useCallback(() => setOpen((prev) => !prev), []);

  const toggleItemExpansion = useCallback(
    (itemId: string) => {
      setExpandedItems((prev: Set<string>) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    },
    [setExpandedItems]
  );

  const handleItemClick = useCallback(
    (item: Menu) => {
      drawerRefs.current.recentlyViewedHandler.handleWindowAccess?.(item);
      onClick(item);
    },
    [onClick]
  );

  const setRecentlyViewedRef = useCallback((ref: RecentlyViewedHandler) => {
    drawerRefs.current.recentlyViewedHandler = ref;
  }, []);
  return (
    <ResizeHandle
      initialWidth={drawerWidth}
      onWidthChange={setDrawerWidth}
      minWidth={open ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH}
      maxWidth={open ? DRAWER_MAX_WIDTH : DRAWER_CLOSED_WIDTH}
      maxOffsetRem={9}
      hideHandle
      direction="horizontal">
      <div
        style={{ width: `${drawerWidth}rem` }}
        className={`h-screen max-h-screen transition-all duration-500 ease-in-out
             bg-(--color-baseline-0) border-none 
             rounded-tr-xl rounded-br-xl flex flex-col overflow-hidden pb-4  ${open ? "w-[16.25rem]" : "w-[3.5rem]"}`}>
        <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
        {open && (
          <div className="p-2 pb-0">
            <TextInputAutocomplete
              value={searchValue}
              setValue={setSearchValue}
              placeholder="Search"
              autoCompleteTexts={allItemTitles}
              inputRef={searchInputRef}
              data-testid="drawer-search-input"
            />
          </div>
        )}
        {RecentlyViewedComponent && (
          <RecentlyViewedComponent
            onClick={handleItemClick}
            open={open}
            items={items}
            windowId={windowId}
            getTranslatedName={getTranslatedName}
            ref={setRecentlyViewedRef}
          />
        )}
        <div className={`flex-grow overflow-y-auto hide-scrollbar ${!open && "flex flex-col gap-2"}`}>
          <DrawerItems
            items={searchValue ? filteredItems : items}
            onClick={handleItemClick}
            onReportClick={onReportClick}
            onProcessClick={onProcessClick}
            open={open}
            expandedItems={expandedItems}
            toggleItemExpansion={toggleItemExpansion}
            searchValue={searchValue}
            windowId={windowId}
            pendingWindowId={pendingWindowId}
          />
        </div>
      </div>
    </ResizeHandle>
  );
};

export { Drawer };

export default Drawer;
