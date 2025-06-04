"use client";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllItemTitles } from "../../utils/searchUtils";
import TextInputAutocomplete from "../Input/TextInput/TextInputAutocomplete";
import DrawerHeader from "./Header";
import { DrawerItems } from "./Search";
import type { DrawerProps } from "./types";

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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const drawerRefs = useRef<{
    recentlyViewedHandler: RecentlyViewedHandler;
  }>({
    recentlyViewedHandler: {},
  });

  const { searchValue, setSearchValue, filteredItems, expandedItems, setExpandedItems, searchIndex } = searchContext;

  useEffect(() => {
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
    [setExpandedItems],
  );

  const handleItemClick = useCallback(
    (item: Menu) => {
      drawerRefs.current.recentlyViewedHandler.handleWindowAccess?.(item);
      onClick(item);
    },
    [onClick],
  );

  const setRecentlyViewedRef = useCallback((ref: RecentlyViewedHandler) => {
    drawerRefs.current.recentlyViewedHandler = ref;
  }, []);

  return (
    <div
      className={`h-screen max-h-screen transition-all duration-500 ease-in-out
      bg-(--color-baseline-0) border-none
      rounded-tr-xl rounded-br-xl flex flex-col overflow-hidden pb-4
      ${open ? "w-[16.25rem]" : "w-[3.5rem]"}`}>
      <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
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
      {open && (
        <div className="p-2">
          <TextInputAutocomplete
            value={searchValue}
            setValue={setSearchValue}
            placeholder="Search"
            autoCompleteTexts={allItemTitles}
            inputRef={searchInputRef}
          />
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
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
  );
};

export { Drawer };

export default Drawer;
