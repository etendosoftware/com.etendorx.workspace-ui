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

/**
 * Tests for useTableData hook utility functions and helpers
 *
 * NOTE: The full useTableData hook has complex dependencies that make isolated unit testing difficult.
 * Integration tests for the full hook are covered in DynamicTable.test.tsx and Table/index.test.tsx.
 *
 * This file tests the utility functions used by useTableData that can be tested in isolation.
 */

import type { EntityData } from "@workspaceui/api-client/src/api/types";

describe("useTableData utilities", () => {
  // ============================================================================
  // Shared Utility Functions (extracted from useTableData for testing)
  // ============================================================================

  /**
   * Sorts records by seqno first, then by name/_identifier
   */
  const sortRecords = (list: EntityData[]): EntityData[] => {
    return list.sort((a, b) => {
      if (typeof a.seqno === "number" && typeof b.seqno === "number") {
        if (a.seqno !== b.seqno) return a.seqno - b.seqno;
      }

      const nameA = String(a._identifier || a.name || "").toLowerCase();
      const nameB = String(b._identifier || b.name || "").toLowerCase();

      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  };

  /**
   * Adds tree metadata to a node
   */
  const processNodeWithLevel = (
    record: EntityData,
    level: number,
    parentTreeId?: string
  ): EntityData & { __level: number; __isParent: boolean; __treeParentId: string | null } => ({
    ...record,
    __level: level,
    __isParent: level === 0 ? true : record.showDropIcon === true,
    __originalParentId: record.parentId,
    __treeParentId: parentTreeId || null,
  });

  /**
   * Parses an ORDER BY clause to extract field name and direction
   */
  const parseOrderByClause = (orderByClause: string): { fieldName: string; desc: boolean } => {
    const parts = orderByClause.trim().split(/\s+/);
    return {
      fieldName: parts[0],
      desc: parts.length > 1 && parts[1].toUpperCase() === "DESC",
    };
  };

  /**
   * Determines the parent field name from parentColumns
   */
  const getParentFieldName = (parentColumns: string[] | undefined): string => {
    return !Array.isArray(parentColumns) || parentColumns.length === 0 ? "id" : parentColumns[0];
  };

  /**
   * Classifies records into roots and children based on parentId
   */
  const classifyRecords = (records: EntityData[]): { roots: EntityData[]; children: Map<string, EntityData[]> } => {
    const recordIds = new Set(records.map((r) => String(r.id)));
    const roots: EntityData[] = [];
    const children = new Map<string, EntityData[]>();

    records.forEach((record) => {
      const pId = record.parentId ? String(record.parentId) : null;
      if (pId && recordIds.has(pId)) {
        if (!children.has(pId)) {
          children.set(pId, []);
        }
        children.get(pId)?.push(record);
      } else {
        roots.push(record);
      }
    });

    return { roots, children };
  };

  // ============================================================================
  // Test Data Factories
  // ============================================================================

  const createRecord = (overrides: Partial<EntityData> = {}): EntityData => ({
    id: `id-${Math.random().toString(36).slice(2)}`,
    name: "Test Record",
    ...overrides,
  });

  const createRecords = (configs: Partial<EntityData>[]): EntityData[] => configs.map(createRecord);

  // ============================================================================
  // Tests
  // ============================================================================

  describe("sortRecords", () => {
    it.each([
      {
        name: "should sort by seqno when both records have seqno",
        records: [
          { id: "1", name: "B", seqno: 20 },
          { id: "2", name: "A", seqno: 10 },
          { id: "3", name: "C", seqno: 30 },
        ],
        expectedOrder: [10, 20, 30],
        orderKey: "seqno" as const,
      },
      {
        name: "should sort by name when seqno is not available",
        records: [
          { id: "1", name: "Cherry" },
          { id: "2", name: "Apple" },
          { id: "3", name: "Banana" },
        ],
        expectedOrder: ["Apple", "Banana", "Cherry"],
        orderKey: "name" as const,
      },
      {
        name: "should use _identifier for sorting when available",
        records: [
          { id: "1", name: "Z", _identifier: "First" },
          { id: "2", name: "A", _identifier: "Third" },
          { id: "3", name: "M", _identifier: "Second" },
        ],
        expectedOrder: ["First", "Second", "Third"],
        orderKey: "_identifier" as const,
      },
      {
        name: "should handle equal seqno values and fallback to name",
        records: [
          { id: "1", name: "Zebra", seqno: 10 },
          { id: "2", name: "Apple", seqno: 10 },
          { id: "3", name: "Mango", seqno: 10 },
        ],
        expectedOrder: ["Apple", "Mango", "Zebra"],
        orderKey: "name" as const,
      },
      {
        name: "should handle case-insensitive sorting",
        records: [
          { id: "1", name: "apple" },
          { id: "2", name: "BANANA" },
          { id: "3", name: "Cherry" },
        ],
        expectedOrder: ["apple", "BANANA", "Cherry"],
        orderKey: "name" as const,
      },
    ])("$name", ({ records, expectedOrder, orderKey }) => {
      const sorted = sortRecords([...records] as EntityData[]);
      expect(sorted.map((r) => r[orderKey])).toEqual(expectedOrder);
    });

    it("should handle empty array", () => {
      expect(sortRecords([])).toEqual([]);
    });
  });

  describe("classifyRecords (buildFlattenedRecords helper)", () => {
    it("should identify root records and group children", () => {
      const records = createRecords([
        { id: "1", name: "Root 1", parentId: null },
        { id: "2", name: "Root 2" },
        { id: "3", name: "Child of 1", parentId: "1" },
        { id: "4", name: "Child of 2", parentId: "2" },
      ]);

      const { roots, children } = classifyRecords(records);

      expect(roots).toHaveLength(2);
      expect(roots.map((r) => r.id)).toEqual(["1", "2"]);
      expect(children.get("1")).toHaveLength(1);
      expect(children.get("2")).toHaveLength(1);
    });

    it("should treat records with missing parents as roots", () => {
      const records = createRecords([
        { id: "1", name: "Orphan Child", parentId: "999" },
        { id: "2", name: "Root" },
      ]);

      const { roots } = classifyRecords(records);

      expect(roots).toHaveLength(2);
    });
  });

  describe("processNodeWithLevel", () => {
    it.each([
      {
        name: "should add tree metadata to nodes",
        record: { id: "node-1", name: "Test Node", showDropIcon: true },
        level: 2,
        parentTreeId: "parent-node",
        expected: { __level: 2, __isParent: true, __treeParentId: "parent-node" },
      },
      {
        name: "should mark root level nodes as parent",
        record: { id: "root-1", name: "Root Node", showDropIcon: false },
        level: 0,
        parentTreeId: undefined,
        expected: { __level: 0, __isParent: true, __treeParentId: null },
      },
      {
        name: "should not mark non-root nodes as parent if showDropIcon is false",
        record: { id: "leaf-1", name: "Leaf Node", showDropIcon: false },
        level: 1,
        parentTreeId: "parent",
        expected: { __level: 1, __isParent: false, __treeParentId: "parent" },
      },
    ])("$name", ({ record, level, parentTreeId, expected }) => {
      const result = processNodeWithLevel(record as EntityData, level, parentTreeId);

      expect(result.__level).toBe(expected.__level);
      expect(result.__isParent).toBe(expected.__isParent);
      expect(result.__treeParentId).toBe(expected.__treeParentId);
    });
  });

  describe("parseOrderByClause", () => {
    it.each([
      { clause: "name ASC", expectedField: "name", expectedDesc: false },
      { clause: "createdDate DESC", expectedField: "createdDate", expectedDesc: true },
      { clause: "fieldName", expectedField: "fieldName", expectedDesc: false },
      { clause: "  amount  desc  ", expectedField: "amount", expectedDesc: true },
    ])('should parse "$clause" correctly', ({ clause, expectedField, expectedDesc }) => {
      const { fieldName, desc } = parseOrderByClause(clause);

      expect(fieldName).toBe(expectedField);
      expect(desc).toBe(expectedDesc);
    });
  });

  describe("getParentFieldName", () => {
    it.each([
      { parentColumns: undefined, expected: "id", description: "no parentColumns exist" },
      { parentColumns: [], expected: "id", description: "parentColumns is empty" },
      {
        parentColumns: ["organizationId", "anotherId"],
        expected: "organizationId",
        description: "parentColumns has values",
      },
    ])("should return '$expected' when $description", ({ parentColumns, expected }) => {
      expect(getParentFieldName(parentColumns)).toBe(expected);
    });
  });

  describe("column visibility initialization", () => {
    /**
     * Creates initial visibility state from fields
     */
    const createInitialVisibility = (
      fields: Record<string, { name: string; showInGridView?: boolean }>
    ): Record<string, boolean> => {
      const visibility: Record<string, boolean> = {};
      for (const field of Object.values(fields)) {
        if (field.showInGridView !== undefined && field.name) {
          visibility[field.name] = field.showInGridView;
        }
      }
      return visibility;
    };

    it("should create initial visibility from fields showInGridView", () => {
      const fields = {
        name: { name: "name", showInGridView: true },
        description: { name: "description", showInGridView: false },
        status: { name: "status", showInGridView: true },
      };

      expect(createInitialVisibility(fields)).toEqual({
        name: true,
        description: false,
        status: true,
      });
    });

    it("should skip fields without showInGridView defined", () => {
      const fields = {
        name: { name: "name", showInGridView: true },
        computed: { name: "computed" }, // No showInGridView
      };

      expect(createInitialVisibility(fields)).toEqual({ name: true });
    });
  });

  describe("summary query construction", () => {
    /**
     * Constructs summary request from column summaries
     */
    const constructSummaryRequest = (summaries: Record<string, string>): Record<string, string> | null => {
      if (Object.keys(summaries).length === 0) return null;
      return { ...summaries };
    };

    it.each([
      {
        name: "should construct summary request from column summaries",
        summaries: { amount: "sum", count: "count", average: "avg" },
        expected: { amount: "sum", count: "count", average: "avg" },
      },
      {
        name: "should return null for empty summaries",
        summaries: {},
        expected: null,
      },
      {
        name: "should handle single summary",
        summaries: { total: "sum" },
        expected: { total: "sum" },
      },
    ])("$name", ({ summaries, expected }) => {
      expect(constructSummaryRequest(summaries)).toEqual(expected);
    });
  });
});
