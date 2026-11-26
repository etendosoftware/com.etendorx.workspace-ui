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
import {
  findAdjacentMenuItem,
  findHighlightedMenuItem,
  findMenuItemById,
  findNavigableMenuItems,
  getMenuItemId,
  MENU_NAVIGATION_OFFSETS,
  type MenuNavigationOffset,
} from "../../utils/drawerUtils";
import TextInputAutocomplete from "../Input/TextInput/TextInputAutocomplete";
import DrawerHeader from "./Header";
import { DrawerHighlightContext } from "./DrawerHighlightContext";
import { DrawerItems } from "./Search";
import type { DrawerProps } from "./types";
import ResizeHandle from "../ResizeHandle";
import { SIDEBAR_SEARCH_INSET_CLASS } from "./spacing";

const DRAWER_STATE_KEY = "etendo-drawer-open";

/** Keys the menu search reacts to. Everything else — Tab included — is left untouched. */
const SEARCH_KEYS = {
  ARROW_DOWN: "ArrowDown",
  ARROW_UP: "ArrowUp",
  ENTER: "Enter",
  ESCAPE: "Escape",
} as const;

const EMPTY_SEARCH_VALUE = "";
interface RecentlyViewedHandler {
  handleWindowAccess?: (item: Menu) => void;
}

/**
 * The autocomplete suggestion in the colors and size of the sidebar search. The text and the Tab
 * hint are muted like the placeholder: the default grays are barely visible on the search
 * background, in light and dark themes. The text has the 13px of the typed text and starts where
 * it starts: 8px of padding of the field, the 24px search button (kept from shrinking, or its width
 * would follow the width of the sidebar) and its 8px margin, so 40px. Attributes from `SuggestionBox`.
 */
const SIDEBAR_SUGGESTION_CLASSES =
  "[&_button]:shrink-0 [&_[data-autocomplete-ghost]]:left-[40px]! [&_[data-autocomplete-ghost]]:text-[13px]! [&_[data-autocomplete-suggestion]]:text-(--ui-text-muted)! [&_[data-autocomplete-tab-hint]_p]:text-(--ui-text-muted)! [&_[data-autocomplete-tab-hint]_svg]:text-(--ui-text-muted)!";

/** Stable test ID of the message shown when the search finds no entry. */
export const DRAWER_NO_RESULTS_TEST_ID = "drawer-search-no-results";

/** Stable test ID of the menu list, which leaves "Recently Viewed" out. */
export const DRAWER_MENU_LIST_TEST_ID = "drawer-menu-list";

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
  onItemHover,
  onReportClick,
  onProcessClick,
  RecentlyViewedComponent,
  VersionComponent,
  getTranslatedName,
  searchContext,
  noResultsLabel,
}) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(DRAWER_STATE_KEY);
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });
  const [drawerWidth, setDrawerWidth] = useState<number>(DRAWER_OPEN_WIDTH);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onItemHoverRef = useRef(onItemHover);
  onItemHoverRef.current = onItemHover;

  // Keyboard navigation never moves the DOM focus out of the search box, so the highlighted entry is
  // reported the way a hovered one is: its window can be loaded before Enter opens it.
  useEffect(() => {
    if (!highlightedItemId) return;
    const item = findMenuItemById(itemsRef.current, highlightedItemId);
    if (item) onItemHoverRef.current?.(item);
  }, [highlightedItemId]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);

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

  /**
   * While a search term is active the first result is highlighted, mirroring the pickList
   * of the Quick Launch of Etendo Classic, so typing and pressing Enter is enough.
   * Without a term nothing is highlighted: the first arrow-down picks, so Enter can never
   * open something the user did not choose.
   *
   * The visible set is only knowable after the list has rendered, which is why this runs
   * as an effect rather than being derived while rendering.
   */
  useEffect(() => {
    if (!searchValue || filteredItems.length === 0) {
      setHighlightedItemId(null);
      return;
    }
    const navigableItems = findNavigableMenuItems(menuListRef.current);
    setHighlightedItemId((current) => {
      const isStillVisible = navigableItems.some((element) => getMenuItemId(element) === current);
      if (isStillVisible) return current;
      return getMenuItemId(navigableItems[0] ?? null);
    });
  }, [searchValue, filteredItems]);

  const moveHighlight = useCallback(
    (offset: MenuNavigationOffset) => {
      const navigableItems = findNavigableMenuItems(menuListRef.current);
      const target = findAdjacentMenuItem(navigableItems, highlightedItemId, offset);
      if (target) {
        setHighlightedItemId(getMenuItemId(target));
      }
    },
    [highlightedItemId]
  );

  /**
   * Enter takes the same path as the mouse: clicking the entry runs the handler of
   * `DrawerSection`, which already decides between expanding a folder and opening a leaf.
   */
  const activateHighlighted = useCallback(() => {
    findHighlightedMenuItem(menuListRef.current, highlightedItemId)?.click();
  }, [highlightedItemId]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === SEARCH_KEYS.ARROW_DOWN) {
        event.preventDefault();
        moveHighlight(MENU_NAVIGATION_OFFSETS.NEXT);
        return;
      }
      if (event.key === SEARCH_KEYS.ARROW_UP) {
        event.preventDefault();
        moveHighlight(MENU_NAVIGATION_OFFSETS.PREVIOUS);
        return;
      }
      if (event.key === SEARCH_KEYS.ENTER) {
        event.preventDefault();
        activateHighlighted();
        return;
      }
      if (event.key === SEARCH_KEYS.ESCAPE && searchValue) {
        event.preventDefault();
        setSearchValue(EMPTY_SEARCH_VALUE);
      }
    },
    [moveHighlight, activateHighlighted, searchValue, setSearchValue]
  );

  const highlightContextValue = useMemo(() => ({ highlightedItemId }), [highlightedItemId]);

  // As the Quick Launch of Classic, a search that matches no entry says so instead of showing an empty list.
  const hasNoResults = Boolean(searchValue) && filteredItems.length === 0;

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
             bg-(--ui-sidebar-bg) text-(--ui-text) border-none
             flex flex-col overflow-hidden ${open ? "w-[16.25rem]" : "w-[3.5rem]"}`}>
        <DrawerHeader logo={logo} title={title} open={open} onClick={handleHeaderClick} tabIndex={-1} />
        {open && (
          // The navigation keys are handled here, on the container, and not on the input:
          // its key events bubble up to this point, so the Tab autocompletion of
          // `TextInputAutocomplete` keeps working untouched — passing it an `onKeyDown`
          // would replace its own handler instead of composing with it.
          <div className="px-3 pt-3 pb-2" onKeyDown={handleSearchKeyDown}>
            <div
              className={`drawer-search ${SIDEBAR_SEARCH_INSET_CLASS} rounded-lg bg-(--ui-search-bg) [&_div]:bg-transparent! [&_div]:rounded-lg! [&_fieldset]:border-0! [&_input]:text-(--ui-text)! [&_input]:text-[13px]! [&_input::placeholder]:text-(--ui-text-muted)! [&_svg]:text-(--ui-text-muted) ${SIDEBAR_SUGGESTION_CLASSES}`}>
              <TextInputAutocomplete
                value={searchValue}
                setValue={setSearchValue}
                placeholder="Search"
                autoCompleteTexts={allItemTitles}
                inputRef={searchInputRef}
                inputProps={{ autoComplete: "off" }}
                data-testid="drawer-search-input"
              />
            </div>
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
        <div
          ref={menuListRef}
          data-testid={DRAWER_MENU_LIST_TEST_ID}
          className={`flex-grow overflow-y-auto hide-scrollbar ${!open && "flex flex-col gap-2"}`}>
          {open && hasNoResults && (
            <output
              className="block px-5 py-2 text-[13px] text-(--ui-text-muted)"
              data-testid={DRAWER_NO_RESULTS_TEST_ID}>
              {noResultsLabel}
            </output>
          )}
          <DrawerHighlightContext.Provider value={highlightContextValue}>
            <DrawerItems
              items={searchValue ? filteredItems : items}
              onClick={handleItemClick}
              onItemHover={onItemHover}
              onReportClick={onReportClick}
              onProcessClick={onProcessClick}
              open={open}
              expandedItems={expandedItems}
              toggleItemExpansion={toggleItemExpansion}
              searchValue={searchValue}
              windowId={windowId}
              pendingWindowId={pendingWindowId}
            />
          </DrawerHighlightContext.Provider>
        </div>
        {open && VersionComponent && <VersionComponent />}
      </div>
    </ResizeHandle>
  );
};

export { Drawer };

export default Drawer;
