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

import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { EditingRowsState, EditingRowData, EditingRowStateUtils } from "../types/inlineEditing";
import { getFieldReference } from "@/utils";

/**
 * Creates utility functions for managing editing row state
 * @param editingRows Current editing rows state
 * @param setEditingRows State setter function
 * @returns Object with utility functions
 */
export function createEditingRowStateUtils(
  editingRowsRef: React.MutableRefObject<EditingRowsState>,
  setEditingRows: React.Dispatch<React.SetStateAction<EditingRowsState>>
): EditingRowStateUtils {
  const addEditingRow = (rowId: string, data: EntityData, isNew = false) => {
    setEditingRows((prev) => ({
      ...prev,
      [rowId]: {
        originalData: data,
        modifiedData: isNew ? { ...data } : {},
        isNew,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: isNew, // New rows always have unsaved changes
      },
    }));
  };

  const removeEditingRow = (rowId: string) => {
    setEditingRows((prev) => {
      const newState = { ...prev };
      delete newState[rowId];
      return newState;
    });
  };

  const updateCellValue = (rowId: string, fieldName: string, value: unknown) => {
    setEditingRows((prev) => {
      const editingRow = prev[rowId];
      if (!editingRow) return prev;

      // Ensure value is compatible with EntityValue type
      const entityValue = value as EntityData[string];
      const newModifiedData = { ...editingRow.modifiedData, [fieldName]: entityValue };
      const hasChanges = Object.keys(newModifiedData).some(
        (key) => newModifiedData[key] !== editingRow.originalData[key]
      );

      // Update validation errors, allowing undefined to clear errors
      const updatedValidationErrors = {
        ...editingRow.validationErrors,
        [fieldName]: undefined,
      };

      return {
        ...prev,
        [rowId]: {
          ...editingRow,
          modifiedData: newModifiedData,
          hasUnsavedChanges: hasChanges || editingRow.isNew,
          // Clear field-specific validation error when value changes
          validationErrors: updatedValidationErrors,
        },
      };
    });
  };

  const setRowValidationErrors = (rowId: string, errors: Record<string, string | undefined>) => {
    setEditingRows((prev) => {
      const editingRow = prev[rowId];
      if (!editingRow) return prev;

      return {
        ...prev,
        [rowId]: {
          ...editingRow,
          validationErrors: errors,
        },
      };
    });
  };

  const setRowSaving = (rowId: string, isSaving: boolean) => {
    setEditingRows((prev) => {
      const editingRow = prev[rowId];
      if (!editingRow) return prev;

      return {
        ...prev,
        [rowId]: {
          ...editingRow,
          isSaving,
        },
      };
    });
  };

  const setCalloutApplying = (rowId: string, isApplying: boolean) => {
    setEditingRows((prev) => {
      const editingRow = prev[rowId];
      if (!editingRow) return prev;

      return {
        ...prev,
        [rowId]: {
          ...editingRow,
          isApplyingCalloutValues: isApplying,
        },
      };
    });
  };

  const isRowEditing = (rowId: string): boolean => {
    return rowId in editingRowsRef.current;
  };

  const getEditingRowData = (rowId: string): EditingRowData | undefined => {
    return editingRowsRef.current[rowId];
  };

  const getEditingRowIds = (): string[] => {
    return Object.keys(editingRowsRef.current);
  };

  const clearAllEditingRows = () => {
    setEditingRows({});
  };

  return {
    addEditingRow,
    removeEditingRow,
    updateCellValue,
    setRowValidationErrors,
    setRowSaving,
    setCalloutApplying,
    isRowEditing,
    getEditingRowData,
    getEditingRowIds,
    clearAllEditingRows,
  };
}

/**
 * Generates a unique ID for new rows
 * @returns Unique string ID
 */
export function generateNewRowId(): string {
  return `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates an empty row data object for new records
 * @param newRowId The unique ID for the new row
 * @param baseColumns Optional column metadata to initialize default values
 * @returns Empty EntityData object with the new ID
 */
export function createEmptyRowData(newRowId: string, baseColumns?: any[]): EntityData {
  const emptyData: EntityData = { id: newRowId };

  // Initialize default values based on column metadata if available
  if (baseColumns) {
    baseColumns.forEach((column) => {
      if (column.name !== "id" && column.name !== "actions") {
        // Use the existing getFieldReference utility to determine field type
        const fieldType = getFieldReference(column.column?.reference);

        // Set default values based on field type
        switch (fieldType) {
          case FieldType.BOOLEAN:
            emptyData[column.name] = false;
            break;
          case FieldType.NUMBER:
          case FieldType.QUANTITY:
          case FieldType.DATE:
          case FieldType.DATETIME:
            emptyData[column.name] = null;
            break;
          default:
            emptyData[column.name] = null;
        }
      }
    });
  }

  return emptyData;
}

/**
 * Merges original data with modified data to get current row data
 * @param editingRowData The editing row data
 * @returns Merged data representing current state
 */
export function getMergedRowData(editingRowData: EditingRowData): EntityData {
  // Filter out undefined values from modifiedData to maintain EntityData type compatibility
  const filteredModifiedData = Object.fromEntries(
    Object.entries(editingRowData.modifiedData).filter(([, value]) => value !== undefined)
  ) as EntityData;

  return {
    ...editingRowData.originalData,
    ...filteredModifiedData,
  };
}

/**
 * Checks if a row has any validation errors
 * @param editingRowData The editing row data
 * @returns True if there are validation errors
 */
export function hasValidationErrors(editingRowData: EditingRowData): boolean {
  return Object.values(editingRowData.validationErrors).some((error) => error !== undefined && error.trim() !== "");
}

/**
 * Gets the display value for a field, handling the merged data
 * @param editingRowData The editing row data
 * @param fieldName The field name
 * @returns The current value for the field
 */
export function getFieldValue(editingRowData: EditingRowData, fieldName: string): unknown {
  // Check modified data first, then fall back to original data
  if (fieldName in editingRowData.modifiedData) {
    return editingRowData.modifiedData[fieldName];
  }
  return editingRowData.originalData[fieldName];
}

/**
 * Inserts a new row at the top of the records array
 * @param currentRecords The current array of records
 * @param newRowData The new row data to insert
 * @returns New array with the new row at the top
 */
export function insertNewRowAtTop(currentRecords: EntityData[], newRowData: EntityData): EntityData[] {
  return [newRowData, ...currentRecords];
}

/**
 * Removes a new row from the records array
 * @param currentRecords The current array of records
 * @param rowId The ID of the row to remove
 * @returns New array without the specified row
 */
export function removeNewRowFromRecords(currentRecords: EntityData[], rowId: string): EntityData[] {
  return currentRecords.filter((record) => String(record.id) !== rowId);
}
