"use client";

import { Box } from "@mui/material";
import type { Menu } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllItemTitles } from "../../utils/searchUtils";
import TextInputAutocomplete from "../Input/TextInput/TextInputAutocomplete";
import { DrawerHeader } from "./Header";
import { DrawerItems } from "./Search";
import { useStyle } from "./styles";
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

  const { sx } = useStyle();
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

  const drawerStyle = useMemo(
    () => ({
      ...sx.drawerPaper,
      width: open ? "16.25rem" : "3.5rem",
      height: "100vh",
      maxHeight: "100vh",
      transition: "all 0.5s ease-in-out",
    }),
    [open, sx.drawerPaper],
  );

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
    <Box sx={drawerStyle}>
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
        <Box sx={{ padding: "0.5rem" }}>
          <TextInputAutocomplete
            value={searchValue}
            setValue={setSearchValue}
            placeholder="Search"
            autoCompleteTexts={allItemTitles}
            inputRef={searchInputRef}
          />
        </Box>
      )}
      <Box sx={sx.drawerContent} tabIndex={0}>
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
      </Box>
    </Box>
  );
};

export { Drawer };

export default Drawer;
