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
import { logger } from "@/utils/logger";
import type { EditingRowData } from "../types/inlineEditing";
import { getMergedRowData } from "./editingRowUtils";

/**
 * Interface for optimistic update operations
 */
export interface OptimisticUpdate {
  type: "create" | "update" | "delete";
  rowId: string;
  originalData?: EntityData;
  newData?: EntityData;
  timestamp: number;
}

/**
 * Interface for optimistic update state
 */
export interface OptimisticUpdateState {
  pendingUpdates: Map<string, OptimisticUpdate>;
  rollbackData: Map<string, EntityData>;
}

/**
 * Creates an optimistic update state manager
 */
export function createOptimisticUpdateManager() {
  const pendingUpdates = new Map<string, OptimisticUpdate>();
  const rollbackData = new Map<string, EntityData>();

  return {
    /**
     * Applies an optimistic update to the table data
     * @param records Current table records
     * @param update The optimistic update to apply
     * @returns Updated records array
     */
    applyOptimisticUpdate(records: EntityData[], update: OptimisticUpdate): EntityData[] {
      logger.debug(`[OptimisticUpdate] Applying ${update.type} update for row: ${update.rowId}`);

      switch (update.type) {
        case "create":
          if (update.newData) {
            // Check if record already exists (e.g. from inline insertion)
            const exists = records.some((r) => String(r.id) === update.rowId);
            if (exists) {
              // Update existing record
              return records.map((record) => (String(record.id) === update.rowId ? update.newData! : record));
            }
            // Add new record to the beginning of the array
            return [update.newData, ...records];
          }
          break;

        case "update":
          if (update.newData) {
            // Update existing record
            return records.map((record) => (String(record.id) === update.rowId ? update.newData! : record));
          }
          break;

        case "delete":
          // Remove record from array
          return records.filter((record) => String(record.id) !== update.rowId);
      }

      return records;
    },

    /**
     * Creates an optimistic update for a new record
     * @param rowId The temporary row ID
     * @param editingRowData The editing row data
     * @returns Optimistic update object
     */
    createOptimisticCreate(rowId: string, editingRowData: EditingRowData): OptimisticUpdate {
      const newData = getMergedRowData(editingRowData);

      return {
        type: "create",
        rowId,
        newData,
        timestamp: Date.now(),
      };
    },

    /**
     * Creates an optimistic update for an existing record
     * @param rowId The row ID
     * @param editingRowData The editing row data
     * @returns Optimistic update object
     */
    createOptimisticUpdate(rowId: string, editingRowData: EditingRowData): OptimisticUpdate {
      const newData = getMergedRowData(editingRowData);

      return {
        type: "update",
        rowId,
        originalData: editingRowData.originalData,
        newData,
        timestamp: Date.now(),
      };
    },

    /**
     * Adds a pending optimistic update
     * @param update The optimistic update
     */
    addPendingUpdate(update: OptimisticUpdate): void {
      pendingUpdates.set(update.rowId, update);

      if (update.originalData) {
        rollbackData.set(update.rowId, update.originalData);
      }

      logger.debug(`[OptimisticUpdate] Added pending ${update.type} for row: ${update.rowId}`);
    },

    /**
     * Confirms a successful optimistic update
     * @param rowId The row ID
     * @param serverData Optional server data to replace optimistic data
     */
    confirmUpdate(rowId: string, serverData?: EntityData): void {
      const update = pendingUpdates.get(rowId);
      if (update) {
        pendingUpdates.delete(rowId);
        rollbackData.delete(rowId);
        logger.debug(`[OptimisticUpdate] Confirmed ${update.type} for row: ${rowId}`);
      }
    },

    /**
     * Rolls back a failed optimistic update
     * @param rowId The row ID
     * @returns The rollback data if available
     */
    rollbackUpdate(rowId: string): EntityData | undefined {
      const update = pendingUpdates.get(rowId);
      const originalData = rollbackData.get(rowId);

      if (update) {
        pendingUpdates.delete(rowId);
        rollbackData.delete(rowId);
        logger.debug(`[OptimisticUpdate] Rolled back ${update.type} for row: ${rowId}`);
      }

      return originalData;
    },

    /**
     * Gets all pending updates
     * @returns Array of pending updates
     */
    getPendingUpdates(): OptimisticUpdate[] {
      return Array.from(pendingUpdates.values());
    },

    /**
     * Checks if a row has a pending update
     * @param rowId The row ID
     * @returns True if there's a pending update
     */
    hasPendingUpdate(rowId: string): boolean {
      return pendingUpdates.has(rowId);
    },

    /**
     * Clears all pending updates (useful for cleanup)
     */
    clearAllUpdates(): void {
      pendingUpdates.clear();
      rollbackData.clear();
      logger.debug(`[OptimisticUpdate] Cleared all pending updates`);
    },

    /**
     * Applies all pending optimistic updates to a records array
     * @param records The base records array
     * @returns Records with all optimistic updates applied
     */
    applyAllOptimisticUpdates(records: EntityData[]): EntityData[] {
      let updatedRecords = [...records];

      // Sort updates by timestamp to apply them in order
      const sortedUpdates = Array.from(pendingUpdates.values()).sort((a, b) => a.timestamp - b.timestamp);

      for (const update of sortedUpdates) {
        updatedRecords = this.applyOptimisticUpdate(updatedRecords, update);
      }

      return updatedRecords;
    },

    /**
     * Rolls back all failed updates and returns the clean records
     * @param records The current records array (with optimistic updates)
     * @param originalRecords The original records array (without optimistic updates)
     * @returns Clean records array
     */
    rollbackAllUpdates(records: EntityData[], originalRecords: EntityData[]): EntityData[] {
      logger.warn(`[OptimisticUpdate] Rolling back all ${pendingUpdates.size} pending updates`);

      this.clearAllUpdates();
      return [...originalRecords];
    },
  };
}

/**
 * Hook-like function to manage optimistic updates in a component
 * @param records Current table records
 * @param setRecords Function to update table records
 * @returns Optimistic update manager with bound functions
 */
export function useOptimisticUpdates(records: EntityData[], setRecords: (records: EntityData[]) => void) {
  const manager = createOptimisticUpdateManager();

  return {
    /**
     * Applies an optimistic update and updates the table data
     * @param update The optimistic update to apply
     */
    applyOptimisticUpdate: (update: OptimisticUpdate) => {
      manager.addPendingUpdate(update);
      const updatedRecords = manager.applyOptimisticUpdate(records, update);
      setRecords(updatedRecords);
    },

    /**
     * Confirms a successful update
     * @param rowId The row ID
     * @param serverData Optional server data
     */
    confirmUpdate: (rowId: string, serverData?: EntityData) => {
      manager.confirmUpdate(rowId, serverData);

      // If server data is provided, update the record with server data
      if (serverData) {
        const updatedRecords = records.map((record) => (String(record.id) === rowId ? serverData : record));
        setRecords(updatedRecords);
      }
    },

    /**
     * Rolls back a failed update
     * @param rowId The row ID
     */
    rollbackUpdate: (rowId: string) => {
      const originalData = manager.rollbackUpdate(rowId);

      if (originalData) {
        // Restore the original data
        const updatedRecords = records.map((record) => (String(record.id) === rowId ? originalData : record));
        setRecords(updatedRecords);
      } else {
        // If it was a create operation, remove the record
        const updatedRecords = records.filter((record) => String(record.id) !== rowId);
        setRecords(updatedRecords);
      }
    },

    /**
     * Gets pending updates
     */
    getPendingUpdates: manager.getPendingUpdates,

    /**
     * Checks if a row has pending updates
     */
    hasPendingUpdate: manager.hasPendingUpdate,

    /**
     * Clears all updates
     */
    clearAllUpdates: manager.clearAllUpdates,
  };
}
