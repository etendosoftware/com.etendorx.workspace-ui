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

import {
  createEditingRowStateUtils,
  generateNewRowId,
  createEmptyRowData,
  insertNewRowAtTop,
  removeNewRowFromRecords,
  getMergedRowData,
  hasValidationErrors,
  getFieldValue,
} from "../utils/editingRowUtils";
import type { EditingRowsState } from "../types/inlineEditing";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

// Mock generateNewRowId to return predictable IDs for testing
jest.mock("../utils/editingRowUtils", () => {
  const actual = jest.requireActual("../utils/editingRowUtils");
  let mockIdCounter = 0;

  return {
    ...actual,
    generateNewRowId: jest.fn(() => `new_${++mockIdCounter}`),
  };
});

describe("Inline Editing Infrastructure", () => {
  let editingRows: EditingRowsState;
  let setEditingRows: jest.Mock;
  let utils: ReturnType<typeof createEditingRowStateUtils>;

  beforeEach(() => {
    // Reset the mock function call count
    (generateNewRowId as jest.Mock).mockClear();

    editingRows = {};
    setEditingRows = jest.fn((updater) => {
      if (typeof updater === "function") {
        editingRows = updater(editingRows);
      } else {
        editingRows = updater;
      }
      editingRowsRef.current = editingRows;
      // Recreate utils with updated state
      utils = createEditingRowStateUtils(editingRowsRef, setEditingRows);
    });
    const editingRowsRef = { current: editingRows };
    utils = createEditingRowStateUtils(editingRowsRef, setEditingRows);
  });

  describe("createEditingRowStateUtils", () => {
    it("should add a row to editing state", () => {
      const rowData: EntityData = { id: "1", name: "Test Row" };

      utils.addEditingRow("1", rowData, false);

      expect(setEditingRows).toHaveBeenCalled();
      expect(editingRows["1"]).toEqual({
        originalData: rowData,
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      });
    });

    it("should add a new row with unsaved changes flag", () => {
      const rowData: EntityData = { id: "new_1", name: "" };

      utils.addEditingRow("new_1", rowData, true);

      // biome-ignore lint/complexity/useLiteralKeys: Using bracket notation for consistency with dynamic keys
      expect(editingRows["new_1"]).toEqual({
        originalData: rowData,
        modifiedData: { ...rowData },
        isNew: true,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      });
    });

    it("should remove a row from editing state", () => {
      const rowData: EntityData = { id: "1", name: "Test Row" };
      utils.addEditingRow("1", rowData, false);

      utils.removeEditingRow("1");

      expect(editingRows["1"]).toBeUndefined();
    });

    it("should update cell value and mark as changed", () => {
      const rowData: EntityData = { id: "1", name: "Original Name" };
      utils.addEditingRow("1", rowData, false);

      utils.updateCellValue("1", "name", "Updated Name");

      expect(editingRows["1"].modifiedData).toEqual({ name: "Updated Name" });
      expect(editingRows["1"].hasUnsavedChanges).toBe(true);
    });

    it("should set validation errors for a row", () => {
      const rowData: EntityData = { id: "1", name: "" };
      utils.addEditingRow("1", rowData, false);

      utils.setRowValidationErrors("1", { name: "Name is required" });

      expect(editingRows["1"].validationErrors).toEqual({ name: "Name is required" });
    });

    it("should set saving state for a row", () => {
      const rowData: EntityData = { id: "1", name: "Test Row" };
      utils.addEditingRow("1", rowData, false);

      utils.setRowSaving("1", true);

      expect(editingRows["1"].isSaving).toBe(true);
    });

    it("should check if a row is being edited", () => {
      const rowData: EntityData = { id: "1", name: "Test Row" };

      expect(utils.isRowEditing("1")).toBe(false);

      utils.addEditingRow("1", rowData, false);

      expect(utils.isRowEditing("1")).toBe(true);
    });

    it("should get editing row data", () => {
      const rowData: EntityData = { id: "1", name: "Test Row" };
      utils.addEditingRow("1", rowData, false);

      const editingData = utils.getEditingRowData("1");

      expect(editingData).toBeDefined();
      expect(editingData?.originalData).toEqual(rowData);
    });

    it("should get all editing row IDs", () => {
      const rowData1: EntityData = { id: "1", name: "Row 1" };
      const rowData2: EntityData = { id: "2", name: "Row 2" };

      utils.addEditingRow("1", rowData1, false);
      utils.addEditingRow("2", rowData2, false);

      const editingIds = utils.getEditingRowIds();

      expect(editingIds).toEqual(["1", "2"]);
    });

    it("should clear all editing rows", () => {
      const rowData1: EntityData = { id: "1", name: "Row 1" };
      const rowData2: EntityData = { id: "2", name: "Row 2" };

      utils.addEditingRow("1", rowData1, false);
      utils.addEditingRow("2", rowData2, false);

      utils.clearAllEditingRows();

      expect(editingRows).toEqual({});
    });
  });

  describe("generateNewRowId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateNewRowId();
      const id2 = generateNewRowId();

      expect(id1).not.toEqual(id2);
      expect(id1).toMatch(/^new_/);
      expect(id2).toMatch(/^new_/);
    });

    it("should generate IDs with correct prefix", () => {
      const id = generateNewRowId();
      expect(id).toMatch(/^new_/);
    });

    it("should generate multiple unique IDs in sequence", () => {
      const ids = Array.from({ length: 10 }, () => generateNewRowId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("getMergedRowData", () => {
    it("should merge original and modified data", () => {
      const editingRowData = {
        originalData: { id: "1", name: "Original", value: 100 },
        modifiedData: { name: "Modified" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const merged = getMergedRowData(editingRowData);

      expect(merged).toEqual({
        id: "1",
        name: "Modified",
        value: 100,
      });
    });

    it("should handle undefined values in modified data", () => {
      const editingRowData = {
        originalData: { id: "1", name: "Original", value: 100 },
        modifiedData: { name: "Modified", value: undefined },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const merged = getMergedRowData(editingRowData);

      expect(merged).toEqual({
        id: "1",
        name: "Modified",
        value: 100, // Original value preserved when modified is undefined
      });
    });
  });

  describe("hasValidationErrors", () => {
    it("should return true when there are validation errors", () => {
      const editingRowData = {
        originalData: { id: "1" },
        modifiedData: {},
        isNew: false,
        validationErrors: { name: "Required field" },
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(hasValidationErrors(editingRowData)).toBe(true);
    });

    it("should return false when there are no validation errors", () => {
      const editingRowData = {
        originalData: { id: "1" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(hasValidationErrors(editingRowData)).toBe(false);
    });

    it("should return false when validation errors are empty strings", () => {
      const editingRowData = {
        originalData: { id: "1" },
        modifiedData: {},
        isNew: false,
        validationErrors: { name: "   " },
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(hasValidationErrors(editingRowData)).toBe(false);
    });
  });

  describe("getFieldValue", () => {
    it("should return modified value when available", () => {
      const editingRowData = {
        originalData: { id: "1", name: "Original" },
        modifiedData: { name: "Modified" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      expect(getFieldValue(editingRowData, "name")).toBe("Modified");
    });

    it("should return original value when not modified", () => {
      const editingRowData = {
        originalData: { id: "1", name: "Original" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(getFieldValue(editingRowData, "name")).toBe("Original");
    });

    it("should return undefined for non-existent fields", () => {
      const editingRowData = {
        originalData: { id: "1" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(getFieldValue(editingRowData, "nonexistent")).toBeUndefined();
    });
  });

  describe("New Row Creation", () => {
    describe("createEmptyRowData", () => {
      it("should create empty row data with just ID", () => {
        const newRowId = "new_123";
        const emptyData = createEmptyRowData(newRowId);

        expect(emptyData).toEqual({ id: newRowId });
      });

      it("should initialize default values based on column metadata", () => {
        const newRowId = "new_123";
        const baseColumns = [
          { name: "id", displayType: "string" },
          { name: "name", displayType: "string", column: { reference: "10" } },
          { name: "active", displayType: "boolean", column: { reference: "20" } },
          { name: "quantity", displayType: "number", column: { reference: "22" } },
          { name: "date", displayType: "date", column: { reference: "15" } },
          { name: "actions", displayType: "string" },
        ];

        const emptyData = createEmptyRowData(newRowId, baseColumns);

        expect(emptyData).toEqual({
          id: newRowId,
          name: null,
          active: false,
          quantity: null,
          date: null,
          // actions should be skipped
        });
      });

      it("should handle columns without displayType", () => {
        const newRowId = "new_123";
        const baseColumns = [{ name: "id" }, { name: "description" }];

        const emptyData = createEmptyRowData(newRowId, baseColumns);

        expect(emptyData).toEqual({
          id: newRowId,
          description: null,
        });
      });

      it("should handle empty columns array", () => {
        const newRowId = "new_123";
        const emptyData = createEmptyRowData(newRowId, []);

        expect(emptyData).toEqual({ id: newRowId });
      });
    });

    describe("insertNewRowAtTop", () => {
      it("should insert new row at the beginning of records array", () => {
        const currentRecords = [
          { id: "1", name: "Record 1" },
          { id: "2", name: "Record 2" },
        ];
        const newRowData = { id: "new_123", name: "New Record" };

        const result = insertNewRowAtTop(currentRecords, newRowData);

        expect(result).toEqual([
          { id: "new_123", name: "New Record" },
          { id: "1", name: "Record 1" },
          { id: "2", name: "Record 2" },
        ]);
      });

      it("should handle empty records array", () => {
        const currentRecords: EntityData[] = [];
        const newRowData = { id: "new_123", name: "New Record" };

        const result = insertNewRowAtTop(currentRecords, newRowData);

        expect(result).toEqual([{ id: "new_123", name: "New Record" }]);
      });

      it("should not modify the original array", () => {
        const currentRecords = [{ id: "1", name: "Record 1" }];
        const newRowData = { id: "new_123", name: "New Record" };

        const result = insertNewRowAtTop(currentRecords, newRowData);

        expect(currentRecords).toEqual([{ id: "1", name: "Record 1" }]);
        expect(result).not.toBe(currentRecords);
      });
    });

    describe("removeNewRowFromRecords", () => {
      it("should remove row with matching ID", () => {
        const currentRecords = [
          { id: "new_123", name: "New Record" },
          { id: "1", name: "Record 1" },
          { id: "2", name: "Record 2" },
        ];

        const result = removeNewRowFromRecords(currentRecords, "new_123");

        expect(result).toEqual([
          { id: "1", name: "Record 1" },
          { id: "2", name: "Record 2" },
        ]);
      });

      it("should handle non-existent row ID", () => {
        const currentRecords = [
          { id: "1", name: "Record 1" },
          { id: "2", name: "Record 2" },
        ];

        const result = removeNewRowFromRecords(currentRecords, "new_123");

        expect(result).toEqual(currentRecords);
      });

      it("should handle empty records array", () => {
        const currentRecords: EntityData[] = [];

        const result = removeNewRowFromRecords(currentRecords, "new_123");

        expect(result).toEqual([]);
      });

      it("should not modify the original array", () => {
        const currentRecords = [
          { id: "new_123", name: "New Record" },
          { id: "1", name: "Record 1" },
        ];

        const result = removeNewRowFromRecords(currentRecords, "new_123");

        expect(currentRecords).toEqual([
          { id: "new_123", name: "New Record" },
          { id: "1", name: "Record 1" },
        ]);
        expect(result).not.toBe(currentRecords);
      });

      it("should handle numeric IDs converted to strings", () => {
        const currentRecords = [
          { id: 123, name: "Record with numeric ID" },
          { id: "new_456", name: "New Record" },
        ];

        const result = removeNewRowFromRecords(currentRecords, "123");

        expect(result).toEqual([{ id: "new_456", name: "New Record" }]);
      });
    });

    describe("New Row Integration", () => {
      it("should create and position new row correctly", () => {
        const newRowId = generateNewRowId();
        const baseColumns = [
          { name: "id", displayType: "string" },
          { name: "name", displayType: "string" },
          { name: "active", displayType: "boolean" },
        ];
        const currentRecords = [{ id: "1", name: "Existing Record", active: true }];

        // Create empty row data
        const emptyRowData = createEmptyRowData(newRowId, baseColumns);

        // Add to editing state
        utils.addEditingRow(newRowId, emptyRowData, true);

        // Insert at top of records
        const updatedRecords = insertNewRowAtTop(currentRecords, emptyRowData);

        // Verify the new row is at the top and in editing state
        expect(updatedRecords[0].id).toBe(newRowId);
        expect(updatedRecords[0]).toEqual({
          id: newRowId,
          name: null,
          active: null, // Without column.reference, defaults to null
        });
        expect(utils.isRowEditing(newRowId)).toBe(true);
        expect(editingRows[newRowId].isNew).toBe(true);
        expect(editingRows[newRowId].hasUnsavedChanges).toBe(true);
      });

      it("should handle new row cancellation correctly", () => {
        const newRowId = generateNewRowId();
        const emptyRowData = createEmptyRowData(newRowId);
        const currentRecords = [emptyRowData, { id: "1", name: "Existing Record" }];

        // Add to editing state
        utils.addEditingRow(newRowId, emptyRowData, true);

        // Cancel the new row
        utils.removeEditingRow(newRowId);
        const updatedRecords = removeNewRowFromRecords(currentRecords, newRowId);

        // Verify the new row is removed from both editing state and records
        expect(utils.isRowEditing(newRowId)).toBe(false);
        expect(updatedRecords).toEqual([{ id: "1", name: "Existing Record" }]);
      });

      it("should maintain new row state during editing", () => {
        const newRowId = generateNewRowId();
        const emptyRowData = createEmptyRowData(newRowId, [
          { name: "name", displayType: "string" },
          { name: "email", displayType: "string" },
        ]);

        // Add to editing state
        utils.addEditingRow(newRowId, emptyRowData, true);

        // Modify some values
        utils.updateCellValue(newRowId, "name", "John Doe");
        utils.updateCellValue(newRowId, "email", "john@example.com");

        // Verify the editing state
        const editingData = utils.getEditingRowData(newRowId);
        expect(editingData?.isNew).toBe(true);
        expect(editingData?.hasUnsavedChanges).toBe(true);
        expect(editingData?.modifiedData).toEqual({
          id: newRowId,
          name: "John Doe",
          email: "john@example.com",
        });
      });
    });
  });
});
