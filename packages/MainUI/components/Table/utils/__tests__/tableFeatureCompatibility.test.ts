import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { EditingRowsState } from "../../types/inlineEditing";
import {
  canSortWithEditingRows,
  canFilterWithEditingRows,
  mergeOptimisticRecordsWithSort,
  canUseVirtualScrollingWithEditing,
  adjustSelectionForEditing,
  shouldDisablePaginationDuringEditing,
} from "../tableFeatureCompatibility";

const makeEditingState = (
  rows: Record<string, { modifiedData: Record<string, unknown>; isNew?: boolean }>
): EditingRowsState => {
  const state: EditingRowsState = {};
  for (const [id, data] of Object.entries(rows)) {
    state[id] = {
      originalData: {} as EntityData,
      modifiedData: data.modifiedData as EntityData,
      isNew: data.isNew || false,
      validationErrors: {},
    };
  }
  return state;
};

describe("tableFeatureCompatibility", () => {
  describe("canSortWithEditingRows", () => {
    it("should allow sorting when no rows are editing", () => {
      expect(canSortWithEditingRows({})).toBe(true);
    });

    it("should allow sorting when editing rows have no changes", () => {
      const state = makeEditingState({ row1: { modifiedData: {} } });
      expect(canSortWithEditingRows(state)).toBe(true);
    });

    it("should block sorting when editing rows have unsaved changes", () => {
      const state = makeEditingState({ row1: { modifiedData: { name: "changed" } } });
      expect(canSortWithEditingRows(state)).toBe(false);
    });

    it("should block sorting for new unsaved rows", () => {
      const state = makeEditingState({ row1: { modifiedData: {}, isNew: true } });
      expect(canSortWithEditingRows(state)).toBe(false);
    });
  });

  describe("canFilterWithEditingRows", () => {
    it("should allow filtering when no rows are editing", () => {
      expect(canFilterWithEditingRows({})).toBe(true);
    });

    it("should block filtering when editing rows have unsaved changes", () => {
      const state = makeEditingState({ row1: { modifiedData: { field: "val" } } });
      expect(canFilterWithEditingRows(state)).toBe(false);
    });
  });

  describe("mergeOptimisticRecordsWithSort", () => {
    it("should return base records when no optimistic records", () => {
      const base = [{ id: "1", name: "A" }] as EntityData[];
      const result = mergeOptimisticRecordsWithSort(base, [], {});
      expect(result).toEqual(base);
    });

    it("should merge optimistic updates into base records", () => {
      const base = [
        { id: "1", name: "A" },
        { id: "2", name: "B" },
      ] as EntityData[];
      const optimistic = [{ id: "1", name: "Updated A" }] as EntityData[];
      const result = mergeOptimisticRecordsWithSort(base, optimistic, {});
      expect(result[0].name).toBe("Updated A");
      expect(result[1].name).toBe("B");
    });

    it("should place new records at the top", () => {
      const base = [{ id: "1", name: "A" }] as EntityData[];
      const optimistic = [
        { id: "new_1", name: "New" },
        { id: "1", name: "A" },
      ] as EntityData[];
      const result = mergeOptimisticRecordsWithSort(base, optimistic, {});
      expect(result[0].id).toBe("new_1");
      expect(result[1].id).toBe("1");
    });
  });

  describe("canUseVirtualScrollingWithEditing", () => {
    it("should allow virtual scrolling when no rows are editing", () => {
      expect(canUseVirtualScrollingWithEditing({}, 10000)).toBe(true);
    });

    it("should allow virtual scrolling for small datasets", () => {
      const state = makeEditingState({ row1: { modifiedData: { x: 1 } } });
      expect(canUseVirtualScrollingWithEditing(state, 500)).toBe(true);
    });

    it("should allow reasonable editing rows in large datasets", () => {
      const state = makeEditingState({ row1: { modifiedData: {} } });
      expect(canUseVirtualScrollingWithEditing(state, 5000)).toBe(true);
    });

    it("should block virtual scrolling with too many editing rows in large datasets", () => {
      const rows: Record<string, any> = {};
      for (let i = 0; i < 20; i++) {
        rows[`row${i}`] = { modifiedData: {} };
      }
      const state = makeEditingState(rows);
      expect(canUseVirtualScrollingWithEditing(state, 1000)).toBe(false);
    });
  });

  describe("adjustSelectionForEditing", () => {
    it("should remove selection from editing rows", () => {
      const selection = { row1: true, row2: true, row3: true };
      const editing = makeEditingState({ row2: { modifiedData: {} } });
      const result = adjustSelectionForEditing(selection, editing);
      expect(result.row1).toBe(true);
      expect(result.row2).toBeUndefined();
      expect(result.row3).toBe(true);
    });

    it("should not modify selection when no editing rows", () => {
      const selection = { row1: true, row2: true };
      const result = adjustSelectionForEditing(selection, {});
      expect(result).toEqual(selection);
    });
  });

  describe("shouldDisablePaginationDuringEditing", () => {
    it("should not disable pagination when no editing rows", () => {
      expect(shouldDisablePaginationDuringEditing({})).toBe(false);
    });

    it("should not disable pagination when editing rows have no changes", () => {
      const state = makeEditingState({ row1: { modifiedData: {} } });
      expect(shouldDisablePaginationDuringEditing(state)).toBe(false);
    });

    it("should disable pagination when editing rows have unsaved changes", () => {
      const state = makeEditingState({ row1: { modifiedData: { field: "changed" } } });
      expect(shouldDisablePaginationDuringEditing(state)).toBe(true);
    });

    it("should disable pagination for new rows", () => {
      const state = makeEditingState({ row1: { modifiedData: {}, isNew: true } });
      expect(shouldDisablePaginationDuringEditing(state)).toBe(true);
    });
  });
});
