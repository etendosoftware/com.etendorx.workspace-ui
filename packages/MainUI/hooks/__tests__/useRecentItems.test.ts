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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, renderHook } from "@testing-library/react";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useRecentItems } from "@/hooks/useRecentItems";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { buildRecentItem, ROLE_ID } from "@/test-utils/recentItems";

const WINDOW_TYPE = "Window";
const TRANSLATED_PREFIX = "Translated ";

const buildMenu = (id: string, overrides: Partial<Menu> = {}): Menu =>
  ({ id, name: `Window ${id}`, windowId: `window-${id}`, type: WINDOW_TYPE, ...overrides }) as Menu;

const storedItem = buildRecentItem("a");
const menuItem = buildMenu("a");
const translate = (item: Menu) => `${TRANSLATED_PREFIX}${item.name}`;

describe("useRecentItems", () => {
  const add = jest.fn();
  const setItems = jest.fn();
  const onClick = jest.fn();

  const renderRecentItems = (roleId = ROLE_ID, menuItems: Menu[] = [menuItem], getTranslatedName?: typeof translate) =>
    renderHook(() => useRecentItems(menuItems, onClick, roleId, getTranslatedName));

  beforeEach(() => {
    jest.clearAllMocks();
    useRecentItemsStore.setState({ items: [storedItem], add, setItems });
  });

  it("exposes the store items and expands on first load", () => {
    const { result } = renderRecentItems();

    expect(result.current.localRecentItems).toEqual([storedItem]);
    expect(result.current.hasItems).toBe(true);
    expect(result.current.isExpanded).toBe(true);
  });

  it("exposes no items while there is no role", () => {
    const { result } = renderRecentItems("");

    expect(result.current.localRecentItems).toEqual([]);
    expect(result.current.hasItems).toBe(false);
  });

  it("toggles the expanded state", () => {
    const { result } = renderRecentItems();

    act(() => result.current.handleToggleExpand());

    expect(result.current.isExpanded).toBe(false);
  });

  it("adds a fresh recent item built from the menu entry", () => {
    const process = buildMenu("p", { type: "Process", processId: "proc-1" } as Partial<Menu>);
    const { result } = renderRecentItems();

    act(() => {
      result.current.addRecentItem(process);
    });

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p", windowId: "p", type: "Process", processId: "proc-1" })
    );
  });

  it("opens the live menu entry and moves it to the front on click", () => {
    const { result } = renderRecentItems();

    act(() => result.current.handleRecentItemClick(storedItem as unknown as Menu));

    expect(onClick).toHaveBeenCalledWith(menuItem);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: menuItem.id, windowId: menuItem.windowId }));
  });

  it("opens the stored item without re-adding it when the menu entry type does not match", () => {
    const { result } = renderRecentItems(ROLE_ID, [buildMenu("a", { type: "Process", id: "window-a" })]);

    act(() => result.current.handleRecentItemClick(storedItem as unknown as Menu));

    expect(onClick).toHaveBeenCalledWith(storedItem);
    expect(add).not.toHaveBeenCalled();
  });

  it("refreshes the item names locally with the translated menu names", () => {
    const { result } = renderRecentItems(ROLE_ID, [menuItem], translate);
    setItems.mockClear();

    act(() => result.current.updateTranslations([menuItem]));

    expect(setItems).toHaveBeenCalledWith([{ ...storedItem, name: translate(menuItem) }]);
  });

  it("does not update the items when the names did not change", () => {
    const { result } = renderRecentItems();

    act(() => result.current.updateTranslations([menuItem]));

    expect(setItems).not.toHaveBeenCalled();
  });
});
