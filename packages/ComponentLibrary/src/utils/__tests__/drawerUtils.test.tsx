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

import { findActive } from "../drawerUtils";

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
});
