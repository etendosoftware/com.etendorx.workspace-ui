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
import { findItemByIdentifier, createMenuItem, createRecentMenuItem, createParentMenuItem } from "../menuUtils";
import type { RecentItem } from "../../components/Drawer/types";

const makeMenu = (overrides: Partial<Menu> = {}): Menu =>
  ({
    _identifier: "id1",
    _entityName: "entity",
    $ref: "id1",
    recordTime: 0,
    id: "id1",
    name: "Item 1",
    ...overrides,
  }) as Menu;

describe("menuUtils", () => {
  describe("findItemByIdentifier", () => {
    it("returns null when items is empty or undefined", () => {
      expect(findItemByIdentifier(undefined, "id1")).toBeNull();
      expect(findItemByIdentifier([], "id1")).toBeNull();
    });

    it("returns null when identifier is undefined", () => {
      const items = [makeMenu({ id: "id1", windowId: "win1", type: "Window" })];
      expect(findItemByIdentifier(items, undefined)).toBeNull();
    });

    it("finds a Window item by windowId", () => {
      const item = makeMenu({ id: "id1", windowId: "win1", type: "Window" });
      expect(findItemByIdentifier([item], "win1")).toBe(item);
    });

    it("finds a Process item by id", () => {
      const item = makeMenu({ id: "proc1", type: "Process" });
      expect(findItemByIdentifier([item], "proc1")).toBe(item);
    });

    it("finds a Report item by id", () => {
      const item = makeMenu({ id: "rep1", type: "Report" });
      expect(findItemByIdentifier([item], "rep1")).toBe(item);
    });

    it("searches recursively in children", () => {
      const child = makeMenu({ id: "child1", windowId: "childWin", type: "Window" });
      const parent = makeMenu({ id: "parent1", children: [child] });
      expect(findItemByIdentifier([parent], "childWin")).toBe(child);
    });

    it("returns null when identifier is not found", () => {
      const item = makeMenu({ id: "id1", windowId: "win1", type: "Window" });
      expect(findItemByIdentifier([item], "nonexistent")).toBeNull();
    });
  });

  describe("createMenuItem", () => {
    it("creates a menu item with the correct shape", () => {
      const item = createMenuItem("myId", "My Name", "MyEntity");
      expect(item.id).toBe("myId");
      expect(item.name).toBe("My Name");
      expect(item._entityName).toBe("MyEntity");
      expect(item._identifier).toBe("myId");
      expect(item.$ref).toBe("myId");
    });
  });

  describe("createRecentMenuItem", () => {
    it("creates a Window recent menu item", () => {
      const recent: RecentItem = { id: "r1", name: "Recent Win", type: "Window", windowId: "w1" };
      const item = createRecentMenuItem(recent);
      expect(item.id).toBe("r1");
      expect(item.type).toBe("Window");
      expect(item.action).toBe("W");
      expect(item.windowId).toBe("w1");
    });

    it("creates a Process recent menu item", () => {
      const recent: RecentItem = { id: "p1", name: "My Process", type: "Process", windowId: "p1" };
      const item = createRecentMenuItem(recent);
      expect(item.action).toBe("P");
      expect(item.windowId).toBe("p1");
    });

    it("creates a Report recent menu item", () => {
      const recent: RecentItem = { id: "rep1", name: "My Report", type: "Report", windowId: "rep1" };
      const item = createRecentMenuItem(recent);
      expect(item.action).toBe("R");
    });
  });

  describe("createParentMenuItem", () => {
    const t = (key: string) => key;

    it("returns base item when items array is empty", () => {
      const result = createParentMenuItem([], t);
      expect(result.id).toBe("recently-viewed");
      expect(result.icon).toBe("⌛");
    });

    it("returns base item when items is not an array", () => {
      const result = createParentMenuItem(null as unknown as RecentItem[], t);
      expect(result.id).toBe("recently-viewed");
    });

    it("builds children from provided items", () => {
      const items: RecentItem[] = [
        { id: "r1", name: "Win A", type: "Window", windowId: "w1" },
        { id: "r2", name: "Win B", type: "Window", windowId: "w2" },
      ];
      const result = createParentMenuItem(items, t);
      expect(result.children).toHaveLength(2);
      expect(result.children?.[0].id).toBe("r1");
      expect(result.children?.[1].id).toBe("r2");
    });
  });
});
