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

const Drawer: React.FC<DrawerProps> = ({
  windowId,
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
  const [drawerWidth, setDrawerWidth] = useState<number>(16.25);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const drawerRefs = useRef<{
    recentlyViewedHandler: RecentlyViewedHandler;
  }>({
    recentlyViewedHandler: {},
  });

  const { searchValue, setSearchValue, filteredItems, expandedItems, setExpandedItems, searchIndex } = searchContext;

  useEffect(() => {
    setDrawerWidth(open ? 16.25 : 3.5);
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
      minWidth={open ? 16.25 : 3.5}
      maxWidth={open ? 50 : 3.5}
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
          />
        </div>
      </div>
    </ResizeHandle>
  );
};

export { Drawer };

export default Drawer;
