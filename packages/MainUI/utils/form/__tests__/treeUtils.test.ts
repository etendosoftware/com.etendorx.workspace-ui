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

import { buildFlatTreeList, getNodeTextClass, buildNodeMap, filterVisibleNodes, type TreeNode } from "../treeUtils";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

describe("buildFlatTreeList", () => {
  it("should return empty array for empty input", () => {
    expect(buildFlatTreeList([])).toEqual([]);
  });

  it("should handle flat records with no parents", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "Alpha" },
      { id: "B", _identifier: "Beta" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "A", depth: 0, hasChildren: false }),
      expect.objectContaining({ id: "B", depth: 0, hasChildren: false }),
    ]);
  });

  it("should nest children under parents using parentId", () => {
    const records: EntityData[] = [
      { id: "ROOT", _identifier: "Root", isCharacteristic: true },
      { id: "CHILD1", _identifier: "Child 1", parentId: "ROOT" },
      { id: "CHILD2", _identifier: "Child 2", parentId: "ROOT" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "ROOT", depth: 0, hasChildren: true }),
      expect.objectContaining({ id: "CHILD1", depth: 1, hasChildren: false }),
      expect.objectContaining({ id: "CHILD2", depth: 1, hasChildren: false }),
    ]);
  });

  it("should handle multi-level nesting (3+ levels)", () => {
    const records: EntityData[] = [
      { id: "L0", _identifier: "Level 0" },
      { id: "L1", _identifier: "Level 1", parentId: "L0" },
      { id: "L2", _identifier: "Level 2", parentId: "L1" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([
      expect.objectContaining({ id: "L0", depth: 0, hasChildren: true }),
      expect.objectContaining({ id: "L1", depth: 1, hasChildren: true }),
      expect.objectContaining({ id: "L2", depth: 2, hasChildren: false }),
    ]);
  });

  it("should treat orphan records as roots", () => {
    const records: EntityData[] = [
      { id: "ORPHAN", _identifier: "Orphan", parentId: "NONEXISTENT" },
      { id: "ROOT", _identifier: "Root" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ depth: 0 });
    expect(result[1]).toMatchObject({ depth: 0 });
  });

  it("should not infinite-loop on circular references", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "A", parentId: "B" },
      { id: "B", _identifier: "B", parentId: "A" },
    ];
    const result = buildFlatTreeList(records);
    expect(result).toHaveLength(2);
  });

  it("should handle single node", () => {
    const records: EntityData[] = [{ id: "ONLY", _identifier: "Only Node" }];
    const result = buildFlatTreeList(records);
    expect(result).toEqual([expect.objectContaining({ id: "ONLY", depth: 0, hasChildren: false })]);
  });

  it("should preserve all original record properties", () => {
    const records: EntityData[] = [
      { id: "A", _identifier: "A", isCharacteristic: true, showOpenIcon: true, customProp: "val" },
    ];
    const result = buildFlatTreeList(records);
    expect(result[0]).toMatchObject({
      id: "A",
      _identifier: "A",
      isCharacteristic: true,
      showOpenIcon: true,
      customProp: "val",
      depth: 0,
      hasChildren: false,
    });
  });
});

describe("getNodeTextClass", () => {
  it("should return non-selectable style when not selectable", () => {
    expect(getNodeTextClass(false, false)).toBe("font-semibold text-baseline-60");
    expect(getNodeTextClass(false, true)).toBe("font-semibold text-baseline-60");
  });

  it("should return selected style when selectable and selected", () => {
    expect(getNodeTextClass(true, true)).toBe("text-dynamic-dark font-medium");
  });

  it("should return default style when selectable and not selected", () => {
    expect(getNodeTextClass(true, false)).toBe("text-baseline-90");
  });
});

describe("buildNodeMap", () => {
  it("should build a map from tree nodes", () => {
    const nodes: TreeNode[] = [
      { id: "A", _identifier: "Alpha", depth: 0, hasChildren: false },
      { id: "B", _identifier: "Beta", depth: 0, hasChildren: false },
    ];
    const map = buildNodeMap(nodes);
    expect(map.size).toBe(2);
    expect(map.get("A")?._identifier).toBe("Alpha");
    expect(map.get("B")?._identifier).toBe("Beta");
  });

  it("should return empty map for empty array", () => {
    expect(buildNodeMap([]).size).toBe(0);
  });
});

describe("filterVisibleNodes", () => {
  const treeNodes: TreeNode[] = [
    { id: "ROOT", _identifier: "Cola", depth: 0, hasChildren: true, isCharacteristic: true },
    { id: "C1", _identifier: "Uva", depth: 1, hasChildren: false, parentId: "ROOT" },
    { id: "C2", _identifier: "Manzana", depth: 1, hasChildren: false, parentId: "ROOT" },
  ];
  const nodeMap = buildNodeMap(treeNodes);

  describe("search filtering", () => {
    it("should filter by search term and keep ancestors", () => {
      const result = filterVisibleNodes(treeNodes, nodeMap, "uva", new Set());
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("ROOT");
      expect(result[1].id).toBe("C1");
    });

    it("should return only matching node when search matches root", () => {
      const result = filterVisibleNodes(treeNodes, nodeMap, "cola", new Set());
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ROOT");
    });

    it("should return empty when no match", () => {
      const result = filterVisibleNodes(treeNodes, nodeMap, "nonexistent", new Set());
      expect(result).toHaveLength(0);
    });
  });

  describe("collapse filtering", () => {
    it("should hide children of collapsed nodes", () => {
      const collapsed = new Set(["ROOT"]);
      const result = filterVisibleNodes(treeNodes, nodeMap, "", collapsed);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ROOT");
    });

    it("should show all nodes when nothing is collapsed", () => {
      const result = filterVisibleNodes(treeNodes, nodeMap, "", new Set());
      expect(result).toHaveLength(3);
    });
  });
});
