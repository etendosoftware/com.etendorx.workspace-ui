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
import {
  findActive,
  findAdjacentMenuItem,
  findHighlightedMenuItem,
  findNavigableMenuItems,
  getMenuItemId,
  isOpenableMenuItem,
  MENU_COLLAPSED_ATTRIBUTE,
  MENU_ITEM_ID_ATTRIBUTE,
  MENU_NAVIGATION_OFFSETS,
  OPENABLE_MENU_ITEM_TYPES,
} from "../drawerUtils";

const WINDOW_ID = "W-1";
const FOLDER_TYPE = "Summary";

const buildItem = (overrides: Partial<Menu> = {}): Menu =>
  ({ id: "item-1", name: "Item", type: "Window", windowId: WINDOW_ID, ...overrides }) as Menu;

/** Markup of one navigable entry, as `MenuTitle` renders it. */
const entryMarkup = (id: string): string => `<div ${MENU_ITEM_ID_ATTRIBUTE}="${id}"></div>`;

/** Markup of the children container of a collapsed section, as `DrawerSection` renders it. */
const collapsedMarkup = (inner: string): string => `<div ${MENU_COLLAPSED_ATTRIBUTE}="true">${inner}</div>`;

const buildRoot = (innerHtml: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = innerHtml;
  return root;
};

const idsOf = (elements: HTMLElement[]): (string | null)[] => elements.map((element) => getMenuItemId(element));

describe("drawerUtils", () => {
  describe("findActive", () => {
    it("should return false when items is undefined", () => {
      expect(findActive("window1")).toBe(false);
    });

    it("should return false when windowId is undefined", () => {
      const items: any[] = [{ windowId: "window1", children: [] }];
      expect(findActive(undefined, items)).toBe(false);
    });

    it("should return true when windowId matches top-level item", () => {
      const items: any[] = [
        { windowId: "window1", children: [] },
        { windowId: "window2", children: [] },
      ];
      expect(findActive("window2", items)).toBe(true);
    });

    it("should return true when windowId matches nested item", () => {
      const items: any[] = [
        {
          windowId: "parent",
          children: [
            { windowId: "child1", children: [] },
            { windowId: "child2", children: [] },
          ],
        },
      ];
      expect(findActive("child2", items)).toBe(true);
    });

    it("should return true when windowId matches deeply nested item", () => {
      const items: any[] = [
        {
          windowId: "level1",
          children: [
            {
              windowId: "level2",
              children: [{ windowId: "level3", children: [] }],
            },
          ],
        },
      ];
      expect(findActive("level3", items)).toBe(true);
    });

    it("should return false when windowId does not match any item", () => {
      const items: any[] = [
        {
          windowId: "window1",
          children: [{ windowId: "window2", children: [] }],
        },
      ];
      expect(findActive("nonexistent", items)).toBe(false);
    });

    it("should handle empty items array", () => {
      expect(findActive("window1", [])).toBe(false);
    });

    it("should handle items without children property", () => {
      const items: any[] = [{ windowId: "window1" }];
      expect(findActive("window1", items)).toBe(true);
    });
  });

  describe("isOpenableMenuItem", () => {
    it.each(OPENABLE_MENU_ITEM_TYPES)("accepts an item of type %s", (type) => {
      expect(isOpenableMenuItem(buildItem({ type }))).toBe(true);
    });

    it("rejects a folder, which is only a container of results", () => {
      expect(isOpenableMenuItem(buildItem({ type: FOLDER_TYPE }))).toBe(false);
    });

    it("rejects an item with no type", () => {
      expect(isOpenableMenuItem(buildItem({ type: undefined }))).toBe(false);
    });

    // Mirrors the dispatch of useItemActions: a Window without windowId is never opened.
    it("rejects a Window with no windowId", () => {
      expect(isOpenableMenuItem(buildItem({ type: "Window", windowId: undefined }))).toBe(false);
    });

    it("rejects a non-Window openable type with no id", () => {
      expect(isOpenableMenuItem(buildItem({ type: "Report", id: "" }))).toBe(false);
    });
  });

  describe("findNavigableMenuItems", () => {
    it("returns the entries in DOM order, which is the order they are shown in", () => {
      const root = buildRoot(entryMarkup("a") + entryMarkup("b") + entryMarkup("c"));

      expect(idsOf(findNavigableMenuItems(root))).toEqual(["a", "b", "c"]);
    });

    it("leaves out the entries of a collapsed section", () => {
      const root = buildRoot(entryMarkup("parent") + collapsedMarkup(entryMarkup("child")) + entryMarkup("next"));

      expect(idsOf(findNavigableMenuItems(root))).toEqual(["parent", "next"]);
    });

    it("leaves out entries nested deep inside a collapsed section", () => {
      const root = buildRoot(collapsedMarkup(`<div><div>${entryMarkup("deep")}</div></div>`));

      expect(findNavigableMenuItems(root)).toHaveLength(0);
    });

    it("keeps the entries of a section that is not collapsed", () => {
      const root = buildRoot(`${entryMarkup("parent")}<div>${entryMarkup("child")}</div>`);

      expect(idsOf(findNavigableMenuItems(root))).toEqual(["parent", "child"]);
    });

    it("returns nothing without a root", () => {
      expect(findNavigableMenuItems(null)).toEqual([]);
    });
  });

  describe("findAdjacentMenuItem", () => {
    const items = findNavigableMenuItems(buildRoot(entryMarkup("a") + entryMarkup("b") + entryMarkup("c")));

    it("moves to the next entry", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, "a", MENU_NAVIGATION_OFFSETS.NEXT))).toBe("b");
    });

    it("moves to the previous entry", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, "b", MENU_NAVIGATION_OFFSETS.PREVIOUS))).toBe("a");
    });

    // Etendo Classic grids stop at the edges instead of wrapping around.
    it("stays on the last entry at the bottom edge", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, "c", MENU_NAVIGATION_OFFSETS.NEXT))).toBe("c");
    });

    it("stays on the first entry at the top edge", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, "a", MENU_NAVIGATION_OFFSETS.PREVIOUS))).toBe("a");
    });

    it("starts at the first entry when nothing is highlighted yet", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, null, MENU_NAVIGATION_OFFSETS.NEXT))).toBe("a");
    });

    it("starts at the first entry when the highlighted one is gone", () => {
      expect(getMenuItemId(findAdjacentMenuItem(items, "vanished", MENU_NAVIGATION_OFFSETS.PREVIOUS))).toBe("a");
    });

    it("returns nothing with an empty list", () => {
      expect(findAdjacentMenuItem([], "a", MENU_NAVIGATION_OFFSETS.NEXT)).toBeNull();
    });
  });

  describe("findHighlightedMenuItem", () => {
    it("finds the highlighted entry", () => {
      const root = buildRoot(entryMarkup("a") + entryMarkup("b"));

      expect(getMenuItemId(findHighlightedMenuItem(root, "b"))).toBe("b");
    });

    it("returns nothing when the highlighted entry became collapsed", () => {
      const root = buildRoot(entryMarkup("a") + collapsedMarkup(entryMarkup("b")));

      expect(findHighlightedMenuItem(root, "b")).toBeNull();
    });

    it("returns nothing without a highlighted id", () => {
      expect(findHighlightedMenuItem(buildRoot(entryMarkup("a")), null)).toBeNull();
    });
  });

  describe("getMenuItemId", () => {
    it("returns null for a missing element", () => {
      expect(getMenuItemId(null)).toBeNull();
    });
  });
});
