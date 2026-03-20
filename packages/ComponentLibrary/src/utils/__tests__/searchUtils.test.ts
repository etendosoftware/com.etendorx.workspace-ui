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
import { createSearchIndex, getAllItemTitles, rebuildTree, filterItems } from "../searchUtils";

const makeMenu = (id: string, name: string, children?: Menu[]): Menu =>
  ({
    _identifier: id,
    _entityName: "entity",
    $ref: id,
    recordTime: 0,
    id,
    name,
    children,
  }) as Menu;

describe("searchUtils", () => {
  describe("createSearchIndex", () => {
    it("returns an empty index for null/undefined input", () => {
      const index = createSearchIndex(null);
      expect(index.byId.size).toBe(0);
      expect(index.byPhrase.size).toBe(0);
    });

    it("returns an empty index for an empty array", () => {
      const index = createSearchIndex([]);
      expect(index.byId.size).toBe(0);
    });

    it("indexes a single item", () => {
      const items = [makeMenu("item1", "Sales Invoice")];
      const index = createSearchIndex(items);
      expect(index.byId.has("item1")).toBe(true);
    });

    it("indexes nested children", () => {
      const child = makeMenu("child1", "Child Item");
      const parent = makeMenu("parent1", "Parent", [child]);
      const index = createSearchIndex([parent]);
      expect(index.byId.has("parent1")).toBe(true);
      expect(index.byId.has("child1")).toBe(true);
    });

    it("stores item words as separate phrase keys", () => {
      const items = [makeMenu("id1", "Sales Invoice")];
      const index = createSearchIndex(items);
      expect(index.byPhrase.has("sales")).toBe(true);
      expect(index.byPhrase.has("invoice")).toBe(true);
      expect(index.byPhrase.has("sales invoice")).toBe(true);
    });
  });

  describe("getAllItemTitles", () => {
    it("returns sorted array of phrase keys", () => {
      const items = [makeMenu("id1", "A B")];
      const index = createSearchIndex(items);
      const titles = getAllItemTitles(index);
      expect(Array.isArray(titles)).toBe(true);
      // shorter entries first
      expect(titles[0].length).toBeLessThanOrEqual(titles[titles.length - 1].length);
    });
  });

  describe("rebuildTree", () => {
    it("returns only items whose ids are in matchingIds", () => {
      const items = [makeMenu("id1", "Item 1"), makeMenu("id2", "Item 2")];
      const result = rebuildTree(items, new Set(["id1"]));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("id1");
    });

    it("includes parent when child matches", () => {
      const child = makeMenu("child1", "Child");
      const parent = makeMenu("parent1", "Parent", [child]);
      const result = rebuildTree([parent], new Set(["child1"]));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("parent1");
      expect(result[0].children?.[0].id).toBe("child1");
    });

    it("returns empty array when no ids match", () => {
      const items = [makeMenu("id1", "Item 1")];
      expect(rebuildTree(items, new Set())).toHaveLength(0);
    });

    it("marks matched items with isSearchResult", () => {
      const items = [makeMenu("id1", "Item 1")];
      const result = rebuildTree(items, new Set(["id1"]));
      expect(result[0].isSearchResult).toBe(true);
    });
  });

  describe("filterItems", () => {
    const items = [makeMenu("id1", "Sales Invoice"), makeMenu("id2", "Purchase Order"), makeMenu("id3", "Sales Order")];

    it("returns all items when searchValue is empty", () => {
      const index = createSearchIndex(items);
      const { filteredItems } = filterItems(items, "", index);
      expect(filteredItems).toBe(items);
    });

    it("filters items matching the search value", () => {
      const index = createSearchIndex(items);
      const { filteredItems } = filterItems(items, "sales", index);
      expect(filteredItems.length).toBe(2);
      const ids = filteredItems.map((i) => i.id);
      expect(ids).toContain("id1");
      expect(ids).toContain("id3");
    });

    it("returns empty array when nothing matches", () => {
      const index = createSearchIndex(items);
      const { filteredItems } = filterItems(items, "nonexistent", index);
      expect(filteredItems).toHaveLength(0);
    });

    it("expands parent ids of matched children", () => {
      const child = makeMenu("child1", "Invoice");
      const parent = makeMenu("parent1", "Root", [child]);
      const nested = [parent];
      const index = createSearchIndex(nested);
      const { searchExpandedItems } = filterItems(nested, "invoice", index);
      expect(searchExpandedItems.has("parent1")).toBe(true);
    });

    it("falls back to word-based search when phrase match returns nothing", () => {
      const multiWordItems = [makeMenu("mw1", "Sales Invoice Entry")];
      const index = createSearchIndex(multiWordItems);
      const { filteredItems } = filterItems(multiWordItems, "sales invoice", index);
      expect(filteredItems.length).toBeGreaterThan(0);
    });
  });
});
