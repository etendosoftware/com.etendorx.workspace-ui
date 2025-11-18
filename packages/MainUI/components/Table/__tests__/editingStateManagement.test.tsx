import { act } from "@testing-library/react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";

import { createEditingRowStateUtils } from "../utils/editingRowUtils";
import { validateFieldValue, createDebouncedValidation } from "../utils/validationUtils";
import type { EditingRowsState } from "../types/inlineEditing";

// Mock data
const mockEntityData: EntityData = {
  id: "test-row-1",
  name: "Test Record",
  quantity: 10,
  isActive: true,
  createdDate: "2023-12-25T10:30:00.000Z",
};

const mockField: Field = {
  name: "name",
  label: "Name",
  type: FieldType.TEXT,
  required: true,
};

const mockNumericField: Field = {
  name: "quantity",
  label: "Quantity",
  type: FieldType.QUANTITY,
  required: true,
};

describe("Editing State Management", () => {
  describe("createEditingRowStateUtils", () => {
    let editingRowsRef: { current: EditingRowsState };
    let setEditingRows: jest.Mock;
    let utils: ReturnType<typeof createEditingRowStateUtils>;

    beforeEach(() => {
      editingRowsRef = { current: {} };
      setEditingRows = jest.fn((updater) => {
        if (typeof updater === "function") {
          editingRowsRef.current = updater(editingRowsRef.current);
        } else {
          editingRowsRef.current = updater;
        }
      });

      // Create utils with a getter function that always returns current state
      utils = createEditingRowStateUtils(editingRowsRef.current, setEditingRows);

      // Override the utility functions to use the ref for current state
      const originalUtils = utils;
      utils = {
        ...originalUtils,
        isRowEditing: (rowId: string) => rowId in editingRowsRef.current,
        getEditingRowData: (rowId: string) => editingRowsRef.current[rowId],
        getEditingRowIds: () => Object.keys(editingRowsRef.current),
      };
    });

    describe("addEditingRow", () => {
      it("should add a new editing row for existing record", () => {
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
        });

        expect(setEditingRows).toHaveBeenCalled();
        expect(editingRowsRef.current["test-row-1"]).toEqual({
          originalData: mockEntityData,
          modifiedData: {},
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: false,
        });
      });

      it("should add a new editing row for new record", () => {
        act(() => {
          utils.addEditingRow("new-row-1", mockEntityData, true);
        });

        expect(editingRowsRef.current["new-row-1"]).toEqual({
          originalData: mockEntityData,
          modifiedData: { ...mockEntityData },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        });
      });
    });

    describe("removeEditingRow", () => {
      it("should remove editing row from state", () => {
        // First add a row
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
        });

        expect(editingRowsRef.current["test-row-1"]).toBeDefined();

        // Then remove it
        act(() => {
          utils.removeEditingRow("test-row-1");
        });

        expect(editingRowsRef.current["test-row-1"]).toBeUndefined();
      });
    });

    describe("updateCellValue", () => {
      beforeEach(() => {
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
        });
      });

      it("should update cell value and mark as having changes", () => {
        act(() => {
          utils.updateCellValue("test-row-1", "name", "Updated Name");
        });

        const editingData = editingRowsRef.current["test-row-1"];
        expect(editingData.modifiedData.name).toBe("Updated Name");
        expect(editingData.hasUnsavedChanges).toBe(true);
      });

      it("should clear validation error for updated field", () => {
        // First set a validation error
        act(() => {
          utils.setRowValidationErrors("test-row-1", { name: "Name is required" });
        });

        expect(editingRowsRef.current["test-row-1"].validationErrors.name).toBe("Name is required");

        // Then update the field value
        act(() => {
          utils.updateCellValue("test-row-1", "name", "Valid Name");
        });

        expect(editingRowsRef.current["test-row-1"].validationErrors.name).toBeUndefined();
      });

      it("should not mark as changed if value equals original", () => {
        act(() => {
          utils.updateCellValue("test-row-1", "name", "Test Record"); // Same as original
        });

        const editingData = editingRowsRef.current["test-row-1"];
        expect(editingData.modifiedData.name).toBe("Test Record");
        expect(editingData.hasUnsavedChanges).toBe(false);
      });
    });

    describe("setRowValidationErrors", () => {
      beforeEach(() => {
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
        });
      });

      it("should set validation errors for row", () => {
        const errors = { name: "Name is required", quantity: "Must be positive" };

        act(() => {
          utils.setRowValidationErrors("test-row-1", errors);
        });

        expect(editingRowsRef.current["test-row-1"].validationErrors).toEqual(errors);
      });
    });

    describe("setRowSaving", () => {
      beforeEach(() => {
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
        });
      });

      it("should set saving state for row", () => {
        act(() => {
          utils.setRowSaving("test-row-1", true);
        });

        expect(editingRowsRef.current["test-row-1"].isSaving).toBe(true);

        act(() => {
          utils.setRowSaving("test-row-1", false);
        });

        expect(editingRowsRef.current["test-row-1"].isSaving).toBe(false);
      });
    });

    describe("utility methods", () => {
      beforeEach(() => {
        act(() => {
          utils.addEditingRow("test-row-1", mockEntityData, false);
          utils.addEditingRow("test-row-2", mockEntityData, true);
        });
      });

      it("should check if row is editing", () => {
        expect(utils.isRowEditing("test-row-1")).toBe(true);
        expect(utils.isRowEditing("non-existent")).toBe(false);
      });

      it("should get editing row data", () => {
        const data = utils.getEditingRowData("test-row-1");
        expect(data).toBeDefined();
        expect(data?.originalData).toEqual(mockEntityData);
      });

      it("should get all editing row IDs", () => {
        const ids = utils.getEditingRowIds();
        expect(ids).toContain("test-row-1");
        expect(ids).toContain("test-row-2");
        expect(ids).toHaveLength(2);
      });

      it("should clear all editing rows", () => {
        act(() => {
          utils.clearAllEditingRows();
        });

        expect(Object.keys(editingRowsRef.current)).toHaveLength(0);
      });
    });
  });

  describe("concurrent editing", () => {
    let editingRowsRef: { current: EditingRowsState };
    let setEditingRows: jest.Mock;
    let utils: ReturnType<typeof createEditingRowStateUtils>;

    beforeEach(() => {
      editingRowsRef = { current: {} };
      setEditingRows = jest.fn((updater) => {
        if (typeof updater === "function") {
          editingRowsRef.current = updater(editingRowsRef.current);
        } else {
          editingRowsRef.current = updater;
        }
      });

      utils = createEditingRowStateUtils(editingRowsRef.current, setEditingRows);

      // Override the utility functions to use the ref for current state
      const originalUtils = utils;
      utils = {
        ...originalUtils,
        isRowEditing: (rowId: string) => rowId in editingRowsRef.current,
        getEditingRowData: (rowId: string) => editingRowsRef.current[rowId],
        getEditingRowIds: () => Object.keys(editingRowsRef.current),
      };
    });

    it("should handle multiple rows being edited simultaneously", () => {
      const row1Data = { ...mockEntityData, id: "row-1" };
      const row2Data = { ...mockEntityData, id: "row-2" };

      act(() => {
        utils.addEditingRow("row-1", row1Data, false);
        utils.addEditingRow("row-2", row2Data, false);
      });

      expect(utils.isRowEditing("row-1")).toBe(true);
      expect(utils.isRowEditing("row-2")).toBe(true);

      // Update values in both rows
      act(() => {
        utils.updateCellValue("row-1", "name", "Updated Row 1");
        utils.updateCellValue("row-2", "name", "Updated Row 2");
      });

      expect(editingRowsRef.current["row-1"].modifiedData.name).toBe("Updated Row 1");
      expect(editingRowsRef.current["row-2"].modifiedData.name).toBe("Updated Row 2");

      // Set different validation errors
      act(() => {
        utils.setRowValidationErrors("row-1", { quantity: "Must be positive" });
        utils.setRowValidationErrors("row-2", { name: "Name too long" });
      });

      expect(editingRowsRef.current["row-1"].validationErrors.quantity).toBe("Must be positive");
      expect(editingRowsRef.current["row-2"].validationErrors.name).toBe("Name too long");

      // Remove one row, other should remain
      act(() => {
        utils.removeEditingRow("row-1");
      });

      expect(utils.isRowEditing("row-1")).toBe(false);
      expect(utils.isRowEditing("row-2")).toBe(true);
    });
  });

  describe("validation logic", () => {
    describe("validateFieldValue", () => {
      it("should validate required fields", () => {
        const requiredField = { ...mockField, required: true };

        expect(validateFieldValue(requiredField, "")).toBeUndefined(); // validateFieldValue no longer validates required fields - this is done by validateFieldRealTime
        expect(validateFieldValue(requiredField, "Valid Value")).toBeUndefined();
      });

      it("should validate numeric fields", () => {
        expect(validateFieldValue(mockNumericField, "not-a-number")).toBe("quantity must be a valid number");
        expect(validateFieldValue(mockNumericField, -5)).toBe("quantity cannot be negative");
        expect(validateFieldValue(mockNumericField, 10)).toBeUndefined();
      });

      it("should validate date fields", () => {
        const dateField: Field = {
          name: "date",
          label: "Date",
          type: FieldType.DATE,
          required: false,
        };

        expect(validateFieldValue(dateField, "invalid-date")).toBe("date must be a valid date");
        expect(validateFieldValue(dateField, "2023-12-25")).toBeUndefined();
        expect(validateFieldValue(dateField, "2023-12-25T10:30:00.000Z")).toBeUndefined();
      });

      it("should validate boolean fields", () => {
        const booleanField: Field = {
          name: "active",
          label: "Active",
          type: FieldType.BOOLEAN,
          required: false,
        };

        expect(validateFieldValue(booleanField, "invalid")).toBe("active must be a valid boolean value");
        expect(validateFieldValue(booleanField, true)).toBeUndefined();
        expect(validateFieldValue(booleanField, false)).toBeUndefined();
        expect(validateFieldValue(booleanField, "Y")).toBeUndefined();
        expect(validateFieldValue(booleanField, "N")).toBeUndefined();
      });

      it("should validate list fields", () => {
        const listField: Field = {
          name: "status",
          label: "Status",
          type: FieldType.LIST,
          required: false,
          refList: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
        };

        expect(validateFieldValue(listField, "invalid-option")).toBe("status must be one of the available options");
        expect(validateFieldValue(listField, "active")).toBeUndefined();
        expect(validateFieldValue(listField, "inactive")).toBeUndefined();
      });
    });

    describe("createDebouncedValidation", () => {
      jest.useFakeTimers();

      it("should debounce validation calls", () => {
        const mockValidationFn = jest.fn();
        const debouncedFn = createDebouncedValidation(mockValidationFn, 300);

        // Call multiple times quickly
        debouncedFn("arg1");
        debouncedFn("arg2");
        debouncedFn("arg3");

        // Should not have been called yet
        expect(mockValidationFn).not.toHaveBeenCalled();

        // Fast-forward time
        act(() => {
          jest.advanceTimersByTime(300);
        });

        // Should have been called only once with the last arguments
        expect(mockValidationFn).toHaveBeenCalledTimes(1);
        expect(mockValidationFn).toHaveBeenCalledWith("arg3");
      });

      it("should reset debounce timer on new calls", () => {
        const mockValidationFn = jest.fn();
        const debouncedFn = createDebouncedValidation(mockValidationFn, 300);

        debouncedFn("arg1");

        // Advance time partially
        act(() => {
          jest.advanceTimersByTime(200);
        });

        // Call again, should reset timer
        debouncedFn("arg2");

        // Advance remaining time from first call
        act(() => {
          jest.advanceTimersByTime(100);
        });

        // Should not have been called yet
        expect(mockValidationFn).not.toHaveBeenCalled();

        // Advance full time from second call
        act(() => {
          jest.advanceTimersByTime(200);
        });

        // Should have been called with second argument
        expect(mockValidationFn).toHaveBeenCalledTimes(1);
        expect(mockValidationFn).toHaveBeenCalledWith("arg2");
      });

      afterEach(() => {
        jest.clearAllTimers();
      });
    });
  });
});
