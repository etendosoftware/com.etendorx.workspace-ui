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
import { fireEvent, render, screen } from "@testing-library/react";
import Drawer from "../index";
import { createSearchIndex, filterItems } from "../../../utils/searchUtils";
import { findNavigableMenuItems, getMenuItemId, MENU_ITEM_ID_ATTRIBUTE } from "../../../utils/drawerUtils";

const SEARCH_PLACEHOLDER = "Search";
const SALES_FOLDER_ID = "folder-sales";
const SALES_ORDER_ID = "win-sales-order";
const SALES_INVOICE_ID = "win-sales-invoice";
const PROCUREMENT_FOLDER_ID = "folder-procurement";
const PURCHASE_ORDER_ID = "win-purchase-order";
const SALES_TERM = "sales";

/**
 * Two folders, each with openable children, plus one leaf at the top level. Mirrors the
 * shape the backend returns: folders are of type `Summary` and are never openable.
 */
const buildMenu = (): Menu[] =>
  [
    {
      id: SALES_FOLDER_ID,
      name: "Sales Management",
      type: "Summary",
      children: [
        { id: SALES_ORDER_ID, name: "Sales Order", type: "Window", windowId: "W-SO", children: [] },
        { id: SALES_INVOICE_ID, name: "Sales Invoice", type: "Window", windowId: "W-SI", children: [] },
      ],
    },
    {
      id: PROCUREMENT_FOLDER_ID,
      name: "Procurement Management",
      type: "Summary",
      children: [{ id: PURCHASE_ORDER_ID, name: "Purchase Order", type: "Window", windowId: "W-PO", children: [] }],
    },
  ] as unknown as Menu[];

interface RenderOptions {
  searchValue?: string;
  expandedItems?: Set<string>;
}

const renderDrawer = ({ searchValue = "", expandedItems = new Set<string>() }: RenderOptions = {}) => {
  const items = buildMenu();
  const searchIndex = createSearchIndex(items);
  const { filteredItems, searchExpandedItems } = filterItems(items, searchValue, searchIndex);
  const onClick = jest.fn();
  const setSearchValue = jest.fn();

  const view = render(
    <Drawer
      items={items}
      logo="logo.png"
      title="Etendo"
      onClick={onClick}
      onReportClick={onClick}
      onProcessClick={onClick}
      searchContext={{
        searchValue,
        setSearchValue,
        filteredItems,
        searchExpandedItems,
        expandedItems,
        setExpandedItems: jest.fn(),
        searchIndex,
      }}
    />
  );

  return { ...view, onClick, setSearchValue, items };
};

const searchInput = (): HTMLElement => screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

const pressKey = (key: string) => fireEvent.keyDown(searchInput(), { key });

/** Id of the entry the keyboard navigation is currently on, read from the rendered list. */
const highlightedId = (): string | null =>
  document.querySelector("[data-highlighted]")?.getAttribute(MENU_ITEM_ID_ATTRIBUTE) ?? null;

/** Entries the arrows can reach, through the very lookup the drawer uses. */
const navigableIds = (): (string | null)[] => findNavigableMenuItems(document.body).map(getMenuItemId);

beforeAll(() => {
  // The drawer reads its open state from localStorage, which the shared setup replaces
  // with jest mocks. The search input only exists while the drawer is open.
  (window.localStorage.getItem as jest.Mock).mockReturnValue("true");
  // jsdom does not implement scrollIntoView, which the highlight calls.
  Element.prototype.scrollIntoView = jest.fn();
});

describe("Drawer menu search — keyboard navigation with a search term", () => {
  it("highlights the first result as soon as there is a term, like the Classic pickList", () => {
    renderDrawer({ searchValue: SALES_TERM });

    expect(highlightedId()).toBe(SALES_ORDER_ID);
  });

  // The folder is rendered as context of the match, but during a search it can neither
  // be collapsed nor opened, so it is not a stop — as getQuickMenuItems does in Classic.
  it("skips the folders that only give context to the results", () => {
    renderDrawer({ searchValue: SALES_TERM });

    expect(navigableIds()).toEqual([SALES_ORDER_ID, SALES_INVOICE_ID]);
  });

  it("moves the highlight down and back up in the visible order", () => {
    renderDrawer({ searchValue: SALES_TERM });

    pressKey("ArrowDown");
    expect(highlightedId()).toBe(SALES_INVOICE_ID);

    pressKey("ArrowUp");
    expect(highlightedId()).toBe(SALES_ORDER_ID);
  });

  it("does not wrap around at either edge", () => {
    renderDrawer({ searchValue: SALES_TERM });

    pressKey("ArrowUp");
    expect(highlightedId()).toBe(SALES_ORDER_ID);

    pressKey("ArrowDown");
    pressKey("ArrowDown");
    expect(highlightedId()).toBe(SALES_INVOICE_ID);
  });

  it("opens the highlighted result with Enter", () => {
    const { onClick } = renderDrawer({ searchValue: SALES_TERM });

    pressKey("ArrowDown");
    pressKey("Enter");

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toMatchObject({ id: SALES_INVOICE_ID });
  });

  it("keeps the term and the results after opening, so several can be opened in a row", () => {
    const { onClick, setSearchValue } = renderDrawer({ searchValue: SALES_TERM });

    pressKey("Enter");

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setSearchValue).not.toHaveBeenCalled();
    expect(highlightedId()).toBe(SALES_ORDER_ID);
  });

  it("clears the term with Escape, restoring the whole menu", () => {
    const { setSearchValue } = renderDrawer({ searchValue: SALES_TERM });

    pressKey("Escape");

    expect(setSearchValue).toHaveBeenCalledWith("");
  });
});

describe("Drawer menu search — keyboard navigation without a search term", () => {
  it("highlights nothing until the first arrow, so Enter never opens an unchosen item", () => {
    const { onClick } = renderDrawer();

    expect(highlightedId()).toBeNull();

    pressKey("Enter");
    expect(onClick).not.toHaveBeenCalled();
  });

  // Without this, an item inside a closed folder would be unreachable by keyboard.
  it("stops on the folders, which are the only way into their children", () => {
    renderDrawer();

    expect(navigableIds()).toEqual([SALES_FOLDER_ID, PROCUREMENT_FOLDER_ID]);

    pressKey("ArrowDown");
    expect(highlightedId()).toBe(SALES_FOLDER_ID);
  });

  it("expands the highlighted folder with Enter and lets the next arrow walk into it", () => {
    renderDrawer();

    pressKey("ArrowDown");
    pressKey("Enter");

    expect(navigableIds()).toEqual([SALES_FOLDER_ID, SALES_ORDER_ID, SALES_INVOICE_ID, PROCUREMENT_FOLDER_ID]);

    pressKey("ArrowDown");
    expect(highlightedId()).toBe(SALES_ORDER_ID);
  });

  it("opens a leaf reached through an expanded folder", () => {
    const { onClick } = renderDrawer();

    pressKey("ArrowDown");
    pressKey("Enter");
    pressKey("ArrowDown");
    pressKey("Enter");

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toMatchObject({ id: SALES_ORDER_ID });
  });

  it("collapses the folder again with a second Enter, putting its children out of reach", () => {
    renderDrawer();

    pressKey("ArrowDown");
    pressKey("Enter");
    expect(navigableIds()).toContain(SALES_ORDER_ID);

    // The highlight stays on the folder, so pressing Enter again toggles it back.
    pressKey("Enter");
    expect(navigableIds()).not.toContain(SALES_ORDER_ID);
  });

  it("does nothing with Escape when there is no term to clear", () => {
    const { setSearchValue } = renderDrawer();

    pressKey("Escape");

    expect(setSearchValue).not.toHaveBeenCalled();
  });
});

describe("Drawer menu search — keys left untouched", () => {
  // The navigation handler sits on the container, so the Tab autocompletion of
  // TextInputAutocomplete keeps running on the input itself.
  it("still completes the suggestion with Tab", () => {
    const { setSearchValue } = renderDrawer({ searchValue: "sal" });
    const input = searchInput();

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Tab" });

    expect(setSearchValue).toHaveBeenCalledTimes(1);
    expect(setSearchValue.mock.calls[0][0]).toMatch(/^sales/i);
  });
});
