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
  hasUnsavedChanges,
  createCancelConfirmationMessage,
  shouldShowCancelConfirmation,
  handleCancelOperation,
  handleBatchCancelOperation,
  handleEscapeKeyCancel,
} from "../utils/cancelOperations";
import type { EditingRowData } from "../types/inlineEditing";

// Mock the logger
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, "confirm", {
  value: mockConfirm,
  writable: true,
});

describe("cancelOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe("hasUnsavedChanges", () => {
    it("should return true for new rows", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "new_123" },
        modifiedData: {},
        isNew: true,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      expect(hasUnsavedChanges(editingRowData)).toBe(true);
    });

    it("should return true when modified data differs from original", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      expect(hasUnsavedChanges(editingRowData)).toBe(true);
    });

    it("should return false when no changes exist", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(hasUnsavedChanges(editingRowData)).toBe(false);
    });

    it("should return false when modified data matches original", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Original Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(hasUnsavedChanges(editingRowData)).toBe(false);
    });
  });

  describe("createCancelConfirmationMessage", () => {
    const mockT = jest.fn((key: string) => key);

    it("should return new row message for new records", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "new_123" },
        modifiedData: {},
        isNew: true,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const result = createCancelConfirmationMessage(editingRowData, mockT);
      expect(result).toBe("table.cancel.confirmNewRow");
      expect(mockT).toHaveBeenCalledWith("table.cancel.confirmNewRow");
    });

    it("should return changes message for existing records", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const result = createCancelConfirmationMessage(editingRowData, mockT);
      expect(result).toBe("table.cancel.confirmChanges");
      expect(mockT).toHaveBeenCalledWith("table.cancel.confirmChanges");
    });
  });

  describe("shouldShowCancelConfirmation", () => {
    it("should return true when forceConfirm is true", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(shouldShowCancelConfirmation(editingRowData, true)).toBe(true);
    });

    it("should return true when there are unsaved changes", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      expect(shouldShowCancelConfirmation(editingRowData)).toBe(true);
    });

    it("should return false when no changes and not forced", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      expect(shouldShowCancelConfirmation(editingRowData)).toBe(false);
    });
  });

  describe("handleCancelOperation", () => {
    const mockRemoveEditingRow = jest.fn();
    const mockOnConfirm = jest.fn();

    beforeEach(() => {
      mockRemoveEditingRow.mockClear();
      mockOnConfirm.mockClear();
    });

    it("should cancel without confirmation when no changes", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      await handleCancelOperation({
        rowId: "456",
        editingRowData,
        removeEditingRow: mockRemoveEditingRow,
        showConfirmation: true,
        onConfirm: mockOnConfirm,
      });

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockOnConfirm).toHaveBeenCalled();
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("456");
    });

    it("should show confirmation and cancel when user confirms", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      mockConfirm.mockReturnValue(true);

      await handleCancelOperation({
        rowId: "456",
        editingRowData,
        removeEditingRow: mockRemoveEditingRow,
        showConfirmation: true,
        onConfirm: mockOnConfirm,
      });

      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to discard your changes?");
      expect(mockOnConfirm).toHaveBeenCalled();
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("456");
    });

    it("should show confirmation for new row", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "new_123" },
        modifiedData: {},
        isNew: true,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      mockConfirm.mockReturnValue(true);

      await handleCancelOperation({
        rowId: "new_123",
        editingRowData,
        removeEditingRow: mockRemoveEditingRow,
        showConfirmation: true,
      });

      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to discard this new row?");
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("new_123");
    });

    it("should throw error when user cancels confirmation", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      mockConfirm.mockReturnValue(false);

      await expect(
        handleCancelOperation({
          rowId: "456",
          editingRowData,
          removeEditingRow: mockRemoveEditingRow,
          showConfirmation: true,
        })
      ).rejects.toThrow("Cancel operation was cancelled by user");

      expect(mockRemoveEditingRow).not.toHaveBeenCalled();
    });

    it("should skip confirmation when showConfirmation is false", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      await handleCancelOperation({
        rowId: "456",
        editingRowData,
        removeEditingRow: mockRemoveEditingRow,
        showConfirmation: false,
      });

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("456");
    });
  });

  describe("handleBatchCancelOperation", () => {
    const mockGetEditingRowData = jest.fn();
    const mockRemoveEditingRow = jest.fn();

    beforeEach(() => {
      mockGetEditingRowData.mockClear();
      mockRemoveEditingRow.mockClear();
    });

    it("should cancel multiple rows with confirmation", async () => {
      const editingRowData1: EditingRowData = {
        originalData: { id: "456", name: "Original Name 1" },
        modifiedData: { name: "Modified Name 1" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const editingRowData2: EditingRowData = {
        originalData: { id: "789", name: "Original Name 2" },
        modifiedData: { name: "Modified Name 2" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      mockGetEditingRowData.mockImplementation((rowId: string) => {
        if (rowId === "456") return editingRowData1;
        if (rowId === "789") return editingRowData2;
        return undefined;
      });

      mockConfirm.mockReturnValue(true);

      await handleBatchCancelOperation({
        rowIds: ["456", "789"],
        getEditingRowData: mockGetEditingRowData,
        removeEditingRow: mockRemoveEditingRow,
        showConfirmation: true,
      });

      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to discard changes for 2 row(s)?");
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("456");
      expect(mockRemoveEditingRow).toHaveBeenCalledWith("789");
    });

    it("should throw error when user cancels batch confirmation", async () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: { name: "Modified Name" },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      mockGetEditingRowData.mockReturnValue(editingRowData);
      mockConfirm.mockReturnValue(false);

      await expect(
        handleBatchCancelOperation({
          rowIds: ["456"],
          getEditingRowData: mockGetEditingRowData,
          removeEditingRow: mockRemoveEditingRow,
          showConfirmation: true,
        })
      ).rejects.toThrow("Batch cancel operation was cancelled by user");

      expect(mockRemoveEditingRow).not.toHaveBeenCalled();
    });
  });

  describe("handleEscapeKeyCancel", () => {
    const mockGetEditingRowData = jest.fn();
    const mockRemoveEditingRow = jest.fn();

    beforeEach(() => {
      mockGetEditingRowData.mockClear();
      mockRemoveEditingRow.mockClear();
    });

    it("should handle escape key for active row", () => {
      const editingRowData: EditingRowData = {
        originalData: { id: "456", name: "Original Name" },
        modifiedData: {},
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: false,
      };

      mockGetEditingRowData.mockReturnValue(editingRowData);

      const event = new KeyboardEvent("keydown", { key: "Escape" });

      handleEscapeKeyCancel({
        event,
        activeRowId: "456",
        getEditingRowData: mockGetEditingRowData,
        removeEditingRow: mockRemoveEditingRow,
      });

      expect(mockGetEditingRowData).toHaveBeenCalledWith("456");
    });

    it("should ignore non-escape keys", () => {
      const event = new KeyboardEvent("keydown", { key: "Enter" });

      handleEscapeKeyCancel({
        event,
        activeRowId: "456",
        getEditingRowData: mockGetEditingRowData,
        removeEditingRow: mockRemoveEditingRow,
      });

      expect(mockGetEditingRowData).not.toHaveBeenCalled();
    });

    it("should ignore when no active row", () => {
      const event = new KeyboardEvent("keydown", { key: "Escape" });

      handleEscapeKeyCancel({
        event,
        activeRowId: null,
        getEditingRowData: mockGetEditingRowData,
        removeEditingRow: mockRemoveEditingRow,
      });

      expect(mockGetEditingRowData).not.toHaveBeenCalled();
    });
  });
});
