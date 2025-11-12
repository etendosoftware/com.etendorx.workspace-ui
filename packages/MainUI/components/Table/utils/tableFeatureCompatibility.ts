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
import type { EditingRowsState } from "../types/inlineEditing";
import { logger } from "@/utils/logger";

/**
 * Utility functions to ensure compatibility between inline editing and existing table features
 */

/**
 * Checks if sorting should be allowed when there are editing rows
 * @param editingRows - Current editing rows state
 * @returns true if sorting is safe, false otherwise
 */
export const canSortWithEditingRows = (editingRows: EditingRowsState): boolean => {
  const editingRowIds = Object.keys(editingRows);
  
  // Allow sorting if no rows are being edited
  if (editingRowIds.length === 0) {
    return true;
  }

  // Check if any editing rows have unsaved changes
  const hasUnsavedChanges = editingRowIds.some(rowId => {
    const editingData = editingRows[rowId];
    return editingData && (
      Object.keys(editingData.modifiedData).length > 0 || 
      editingData.isNew
    );
  });

  if (hasUnsavedChanges) {
    logger.warn('[TableCompatibility] Sorting blocked due to unsaved changes in editing rows');
    return false;
  }

  return true;
};

/**
 * Checks if filtering should be allowed when there are editing rows
 * @param editingRows - Current editing rows state
 * @returns true if filtering is safe, false otherwise
 */
export const canFilterWithEditingRows = (editingRows: EditingRowsState): boolean => {
  const editingRowIds = Object.keys(editingRows);
  
  // Allow filtering if no rows are being edited
  if (editingRowIds.length === 0) {
    return true;
  }

  // Check if any editing rows have unsaved changes
  const hasUnsavedChanges = editingRowIds.some(rowId => {
    const editingData = editingRows[rowId];
    return editingData && (
      Object.keys(editingData.modifiedData).length > 0 || 
      editingData.isNew
    );
  });

  if (hasUnsavedChanges) {
    logger.warn('[TableCompatibility] Filtering blocked due to unsaved changes in editing rows');
    return false;
  }

  return true;
};

/**
 * Merges optimistic updates with base records while preserving sort order
 * @param baseRecords - Original records from the server
 * @param optimisticRecords - Records with optimistic updates applied
 * @param editingRows - Current editing state
 * @returns Merged records that maintain consistency
 */
export const mergeOptimisticRecordsWithSort = (
  baseRecords: EntityData[],
  optimisticRecords: EntityData[],
  editingRows: EditingRowsState
): EntityData[] => {
  if (optimisticRecords.length === 0) {
    return baseRecords;
  }

  // Create a map of base records for quick lookup
  const baseRecordMap = new Map(baseRecords.map(record => [String(record.id), record]));
  
  // Create a map of optimistic records
  const optimisticRecordMap = new Map(optimisticRecords.map(record => [String(record.id), record]));
  
  // Start with base records and apply optimistic updates
  const mergedRecords: EntityData[] = [];
  
  // Add new records (those that exist in optimistic but not in base) at the top
  const newRecords = optimisticRecords.filter(record => 
    !baseRecordMap.has(String(record.id)) && String(record.id).startsWith('new_')
  );
  mergedRecords.push(...newRecords);
  
  // Add existing records with optimistic updates applied
  for (const baseRecord of baseRecords) {
    const recordId = String(baseRecord.id);
    const optimisticRecord = optimisticRecordMap.get(recordId);
    
    if (optimisticRecord) {
      // Use optimistic version if it exists
      mergedRecords.push(optimisticRecord);
    } else {
      // Use base record if no optimistic update
      mergedRecords.push(baseRecord);
    }
  }
  
  return mergedRecords;
};

/**
 * Validates that virtual scrolling can work properly with editing rows
 * @param editingRows - Current editing rows state
 * @param totalRecords - Total number of records
 * @returns true if virtual scrolling is safe, false otherwise
 */
export const canUseVirtualScrollingWithEditing = (
  editingRows: EditingRowsState,
  totalRecords: number
): boolean => {
  const editingRowIds = Object.keys(editingRows);
  
  // Virtual scrolling is always safe if no rows are being edited
  if (editingRowIds.length === 0) {
    return true;
  }

  // For small datasets, virtual scrolling with editing is fine
  if (totalRecords < 1000) {
    return true;
  }

  // For large datasets, check if editing rows are within reasonable bounds
  const maxEditingRows = Math.max(10, Math.floor(totalRecords * 0.01)); // Max 1% or 10 rows
  
  if (editingRowIds.length > maxEditingRows) {
    logger.warn(`[TableCompatibility] Too many editing rows (${editingRowIds.length}) for virtual scrolling with ${totalRecords} total records`);
    return false;
  }

  return true;
};

/**
 * Handles row selection changes while preserving editing state
 * @param newSelection - New row selection state
 * @param editingRows - Current editing rows state
 * @returns Adjusted selection that doesn't conflict with editing
 */
export const adjustSelectionForEditing = (
  newSelection: Record<string, boolean>,
  editingRows: EditingRowsState
): Record<string, boolean> => {
  const adjustedSelection = { ...newSelection };
  
  // Remove selection from rows that are currently being edited to avoid conflicts
  Object.keys(editingRows).forEach(editingRowId => {
    if (adjustedSelection[editingRowId]) {
      delete adjustedSelection[editingRowId];
      logger.debug(`[TableCompatibility] Removed selection from editing row: ${editingRowId}`);
    }
  });
  
  return adjustedSelection;
};

/**
 * Checks if pagination should be disabled during editing
 * @param editingRows - Current editing rows state
 * @returns true if pagination should be disabled
 */
export const shouldDisablePaginationDuringEditing = (editingRows: EditingRowsState): boolean => {
  const editingRowIds = Object.keys(editingRows);
  
  // Disable pagination if there are any editing rows to prevent data loss
  if (editingRowIds.length > 0) {
    const hasUnsavedChanges = editingRowIds.some(rowId => {
      const editingData = editingRows[rowId];
      return editingData && (
        Object.keys(editingData.modifiedData).length > 0 || 
        editingData.isNew
      );
    });
    
    if (hasUnsavedChanges) {
      logger.info('[TableCompatibility] Pagination disabled due to unsaved changes');
      return true;
    }
  }
  
  return false;
};