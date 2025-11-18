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

import { logger } from "@/utils/logger";
import type { EditingRowData } from "../types/inlineEditing";

/**
 * Checks if a row has unsaved changes that would be lost on cancel
 * @param editingRowData The editing row data
 * @returns True if there are unsaved changes
 */
export function hasUnsavedChanges(editingRowData: EditingRowData): boolean {
  // New rows always have unsaved changes
  if (editingRowData.isNew) {
    return true;
  }

  // Check if any modified data differs from original data
  return Object.keys(editingRowData.modifiedData).some(
    (key) => editingRowData.modifiedData[key] !== editingRowData.originalData[key]
  );
}

/**
 * Creates a confirmation message for canceling changes
 * @param editingRowData The editing row data
 * @param t Translation function
 * @returns Confirmation message
 */
export function createCancelConfirmationMessage(editingRowData: EditingRowData, t: (key: string) => string): string {
  if (editingRowData.isNew) {
    return t("table.cancel.confirmNewRow");
  } else {
    return t("table.cancel.confirmChanges");
  }
}

/**
 * Determines if a confirmation dialog should be shown before canceling
 * @param editingRowData The editing row data
 * @param forceConfirm Whether to force confirmation even without changes
 * @returns True if confirmation should be shown
 */
export function shouldShowCancelConfirmation(editingRowData: EditingRowData, forceConfirm = false): boolean {
  return forceConfirm || hasUnsavedChanges(editingRowData);
}

/**
 * Handles the cancel operation for a row
 * @param rowId The row ID to cancel
 * @param editingRowData The editing row data
 * @param removeEditingRow Function to remove row from editing state
 * @param showConfirmation Whether to show confirmation dialog
 * @param onConfirm Optional callback when user confirms cancellation
 * @param confirmationCallback Optional async callback to show confirmation dialog
 * @returns Promise that resolves when cancel is complete or rejected if cancelled
 */
export async function handleCancelOperation({
  rowId,
  editingRowData,
  removeEditingRow,
  showConfirmation = true,
  onConfirm,
  confirmationCallback,
}: {
  rowId: string;
  editingRowData: EditingRowData;
  removeEditingRow: (rowId: string) => void;
  showConfirmation?: boolean;
  onConfirm?: () => void;
  confirmationCallback?: (message: string, title?: string) => Promise<boolean>;
}): Promise<void> {
  logger.info(`[CancelOperation] Starting cancel for row: ${rowId}`, {
    isNew: editingRowData.isNew,
    hasChanges: hasUnsavedChanges(editingRowData),
  });

  // Check if we need to show confirmation
  if (showConfirmation && shouldShowCancelConfirmation(editingRowData)) {
    const message = editingRowData.isNew
      ? "Are you sure you want to discard this new row?"
      : "Are you sure you want to discard your changes?";

    const title = editingRowData.isNew ? "Discard New Row" : "Discard Changes";

    // Use custom confirmation callback if provided, otherwise fallback to window.confirm
    const confirmed = confirmationCallback
      ? await confirmationCallback(message, title)
      : window.confirm(message);

    if (!confirmed) {
      logger.info(`[CancelOperation] User cancelled the cancel operation for row: ${rowId}`);
      throw new Error("Cancel operation was cancelled by user");
    }
  }

  // Execute the cancel operation
  try {
    if (onConfirm) {
      onConfirm();
    }

    // Remove the row from editing state
    removeEditingRow(rowId);

    if (editingRowData.isNew) {
      logger.info(`[CancelOperation] Removed new row: ${rowId}`);
    } else {
      logger.info(`[CancelOperation] Discarded changes for existing row: ${rowId}`);
    }
  } catch (error) {
    logger.error(`[CancelOperation] Failed to cancel row ${rowId}:`, error);
    throw error;
  }
}

/**
 * Batch cancel operation for multiple rows
 * @param rowIds Array of row IDs to cancel
 * @param getEditingRowData Function to get editing row data
 * @param removeEditingRow Function to remove row from editing state
 * @param showConfirmation Whether to show confirmation dialog
 * @param confirmationCallback Optional async callback to show confirmation dialog
 * @returns Promise that resolves when all cancels are complete
 */
export async function handleBatchCancelOperation({
  rowIds,
  getEditingRowData,
  removeEditingRow,
  showConfirmation = true,
  confirmationCallback,
}: {
  rowIds: string[];
  getEditingRowData: (rowId: string) => EditingRowData | undefined;
  removeEditingRow: (rowId: string) => void;
  showConfirmation?: boolean;
  confirmationCallback?: (message: string, title?: string) => Promise<boolean>;
}): Promise<void> {
  logger.info(`[CancelOperation] Starting batch cancel for ${rowIds.length} rows`);

  // Check if any rows have unsaved changes
  const rowsWithChanges = rowIds.filter((rowId) => {
    const editingRowData = getEditingRowData(rowId);
    return editingRowData && hasUnsavedChanges(editingRowData);
  });

  // Show confirmation if needed
  if (showConfirmation && rowsWithChanges.length > 0) {
    const message = `Are you sure you want to discard changes for ${rowsWithChanges.length} row(s)?`;
    const title = "Discard Changes";

    // Use custom confirmation callback if provided, otherwise fallback to window.confirm
    const confirmed = confirmationCallback
      ? await confirmationCallback(message, title)
      : window.confirm(message);

    if (!confirmed) {
      logger.info(`[CancelOperation] User cancelled the batch cancel operation`);
      throw new Error("Batch cancel operation was cancelled by user");
    }
  }

  // Cancel all rows
  const cancelPromises = rowIds.map(async (rowId) => {
    const editingRowData = getEditingRowData(rowId);
    if (editingRowData) {
      await handleCancelOperation({
        rowId,
        editingRowData,
        removeEditingRow,
        showConfirmation: false, // Already confirmed above
      });
    }
  });

  await Promise.all(cancelPromises);
  logger.info(`[CancelOperation] Completed batch cancel for ${rowIds.length} rows`);
}

/**
 * Handles escape key press to cancel editing
 * @param event The keyboard event
 * @param activeRowId The currently active row ID
 * @param getEditingRowData Function to get editing row data
 * @param removeEditingRow Function to remove row from editing state
 */
export function handleEscapeKeyCancel({
  event,
  activeRowId,
  getEditingRowData,
  removeEditingRow,
}: {
  event: KeyboardEvent;
  activeRowId: string | null;
  getEditingRowData: (rowId: string) => EditingRowData | undefined;
  removeEditingRow: (rowId: string) => void;
}): void {
  if (event.key === "Escape" && activeRowId) {
    const editingRowData = getEditingRowData(activeRowId);
    if (editingRowData) {
      handleCancelOperation({
        rowId: activeRowId,
        editingRowData,
        removeEditingRow,
        showConfirmation: hasUnsavedChanges(editingRowData),
      }).catch(() => {
        // User cancelled the cancel operation, do nothing
      });
    }
  }
}
