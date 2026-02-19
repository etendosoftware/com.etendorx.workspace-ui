import type { EntityData } from "@workspaceui/api-client/src/api/types";
import {
  canSortWithEditingRows,
  canFilterWithEditingRows,
  mergeOptimisticRecordsWithSort,
  canUseVirtualScrollingWithEditing,
  adjustSelectionForEditing,
  shouldDisablePaginationDuringEditing,
} from "../utils/tableFeatureCompatibility";
import type { EditingRowsState } from "../types/inlineEditing";

// Mock data for testing
const mockRecords: EntityData[] = [
  { id: "1", name: "Record 1", value: 100, active: true },
  { id: "2", name: "Record 2", value: 200, active: false },
  { id: "3", name: "Record 3", value: 300, active: true },
];

const mockColumns = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "value", header: "Value", accessorKey: "value" },
  { id: "active", header: "Active", accessorKey: "active" },
];

describe("Table Feature Integration with Inline Editing", () => {
  describe("Sorting Compatibility", () => {
    it("should allow sorting when no rows are being edited", () => {
      const editingRows: EditingRowsState = {};
      expect(canSortWithEditingRows(editingRows)).toBe(true);
    });

    it("should allow sorting when editing rows have no unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: {},
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: false,
        },
      };
      expect(canSortWithEditingRows(editingRows)).toBe(true);
    });

    it("should block sorting when editing rows have unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified Name" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(canSortWithEditingRows(editingRows)).toBe(false);
    });

    it("should block sorting when there are new rows", () => {
      const editingRows: EditingRowsState = {
        new_1: {
          originalData: { id: "new_1", name: "", value: 0, active: false },
          modifiedData: { name: "New Record" },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(canSortWithEditingRows(editingRows)).toBe(false);
    });
  });

  describe("Filtering Compatibility", () => {
    it("should allow filtering when no rows are being edited", () => {
      const editingRows: EditingRowsState = {};
      expect(canFilterWithEditingRows(editingRows)).toBe(true);
    });

    it("should allow filtering when editing rows have no unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: {},
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: false,
        },
      };
      expect(canFilterWithEditingRows(editingRows)).toBe(true);
    });

    it("should block filtering when editing rows have unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified Name" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(canFilterWithEditingRows(editingRows)).toBe(false);
    });
  });

  describe("Optimistic Updates with Sorting", () => {
    it("should merge optimistic records while preserving sort order", () => {
      const baseRecords = mockRecords;
      const optimisticRecords = [
        { id: "new_1", name: "New Record", value: 150, active: true },
        { id: "1", name: "Updated Record 1", value: 100, active: true },
        { id: "2", name: "Record 2", value: 200, active: false },
        { id: "3", name: "Record 3", value: 300, active: true },
      ];
      const editingRows: EditingRowsState = {};

      const merged = mergeOptimisticRecordsWithSort(baseRecords, optimisticRecords, editingRows);

      // New records should be at the top
      expect(merged[0].id).toBe("new_1");
      // Updated records should maintain their position
      expect(merged[1].id).toBe("1");
      expect(merged[1].name).toBe("Updated Record 1");
      // Other records should remain unchanged
      expect(merged[2].id).toBe("2");
      expect(merged[3].id).toBe("3");
    });

    it("should handle empty optimistic records", () => {
      const baseRecords = mockRecords;
      const optimisticRecords: EntityData[] = [];
      const editingRows: EditingRowsState = {};

      const merged = mergeOptimisticRecordsWithSort(baseRecords, optimisticRecords, editingRows);

      expect(merged).toEqual(baseRecords);
    });
  });

  describe("Virtual Scrolling Compatibility", () => {
    it("should allow virtual scrolling with no editing rows", () => {
      const editingRows: EditingRowsState = {};
      expect(canUseVirtualScrollingWithEditing(editingRows, 1000)).toBe(true);
    });

    it("should allow virtual scrolling with small datasets", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(canUseVirtualScrollingWithEditing(editingRows, 100)).toBe(true);
    });

    it("should allow virtual scrolling with reasonable number of editing rows", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(canUseVirtualScrollingWithEditing(editingRows, 10000)).toBe(true);
    });

    it("should block virtual scrolling with too many editing rows", () => {
      // Create many editing rows
      const editingRows: EditingRowsState = {};
      for (let i = 1; i <= 200; i++) {
        editingRows[String(i)] = {
          originalData: { id: String(i), name: `Record ${i}`, value: i * 10, active: true },
          modifiedData: { name: `Modified ${i}` },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };
      }
      expect(canUseVirtualScrollingWithEditing(editingRows, 10000)).toBe(false);
    });
  });

  describe("Row Selection Compatibility", () => {
    it("should preserve selection when no editing rows", () => {
      const selection = { "1": true, "2": true };
      const editingRows: EditingRowsState = {};

      const adjusted = adjustSelectionForEditing(selection, editingRows);

      expect(adjusted).toEqual(selection);
    });

    it("should remove selection from editing rows", () => {
      const selection = { "1": true, "2": true, "3": true };
      const editingRows: EditingRowsState = {
        "2": {
          originalData: mockRecords[1],
          modifiedData: { name: "Modified" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };

      const adjusted = adjustSelectionForEditing(selection, editingRows);

      expect(adjusted).toEqual({ "1": true, "3": true });
      expect(adjusted["2"]).toBeUndefined();
    });
  });

  describe("Pagination Compatibility", () => {
    it("should not disable pagination when no editing rows", () => {
      const editingRows: EditingRowsState = {};
      expect(shouldDisablePaginationDuringEditing(editingRows)).toBe(false);
    });

    it("should not disable pagination when editing rows have no unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: {},
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: false,
        },
      };
      expect(shouldDisablePaginationDuringEditing(editingRows)).toBe(false);
    });

    it("should disable pagination when editing rows have unsaved changes", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(shouldDisablePaginationDuringEditing(editingRows)).toBe(true);
    });

    it("should disable pagination when there are new rows", () => {
      const editingRows: EditingRowsState = {
        new_1: {
          originalData: { id: "new_1", name: "", value: 0, active: false },
          modifiedData: { name: "New Record" },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };
      expect(shouldDisablePaginationDuringEditing(editingRows)).toBe(true);
    });
  });

  describe("Performance with Large Datasets", () => {
    it("should efficiently check virtual scrolling compatibility", () => {
      const editingRows: EditingRowsState = {};
      for (let i = 1; i <= 50; i++) {
        editingRows[String(i)] = {
          originalData: { id: String(i), name: `Record ${i}`, value: i * 10, active: true },
          modifiedData: { name: `Modified ${i}` },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };
      }

      const startTime = performance.now();
      const canUseVirtualScrolling = canUseVirtualScrollingWithEditing(editingRows, 100000);
      const endTime = performance.now();

      // Should complete very quickly (less than 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      expect(canUseVirtualScrolling).toBe(true);
    });
  });

  describe("Error State Integration", () => {
    it("should handle validation errors during sorting", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "" }, // Invalid empty name
          isNew: false,
          validationErrors: { name: "Name is required" },
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };

      // Should block sorting due to unsaved changes, even with validation errors
      expect(canSortWithEditingRows(editingRows)).toBe(false);
    });

    it("should handle validation errors during filtering", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { value: -100 }, // Invalid negative value
          isNew: false,
          validationErrors: { value: "Value must be positive" },
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };

      // Should block filtering due to unsaved changes, even with validation errors
      expect(canFilterWithEditingRows(editingRows)).toBe(false);
    });
  });

  describe("Concurrent Editing Scenarios", () => {
    it("should handle multiple rows being edited simultaneously", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: { name: "Modified 1" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
        "2": {
          originalData: mockRecords[1],
          modifiedData: { value: 250 },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
        new_1: {
          originalData: { id: "new_1", name: "", value: 0, active: false },
          modifiedData: { name: "New Record", value: 400 },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        },
      };

      // All operations should be blocked due to unsaved changes
      expect(canSortWithEditingRows(editingRows)).toBe(false);
      expect(canFilterWithEditingRows(editingRows)).toBe(false);
      expect(shouldDisablePaginationDuringEditing(editingRows)).toBe(true);

      // Selection should be adjusted to exclude editing rows
      const selection = { "1": true, "2": true, "3": true };
      const adjusted = adjustSelectionForEditing(selection, editingRows);
      expect(adjusted).toEqual({ "3": true });
    });

    it("should handle mixed editing states", () => {
      const editingRows: EditingRowsState = {
        "1": {
          originalData: mockRecords[0],
          modifiedData: {},
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: false, // No unsaved changes
        },
        "2": {
          originalData: mockRecords[1],
          modifiedData: { name: "Modified" },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true, // Has unsaved changes
        },
      };

      // Should be blocked due to row 2 having unsaved changes
      expect(canSortWithEditingRows(editingRows)).toBe(false);
      expect(canFilterWithEditingRows(editingRows)).toBe(false);
    });
  });
});
