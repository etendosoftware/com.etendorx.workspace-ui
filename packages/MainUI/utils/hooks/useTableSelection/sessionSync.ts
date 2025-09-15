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
  fetchFormInitialization,
  buildFormInitializationPayload,
  buildFormInitializationParams,
} from "@/utils/hooks/useFormInitialization/utils";
import { SessionMode, type Tab, type EntityData } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";

export interface SessionSyncOptions {
  tab: Tab;
  selectedRecords: EntityData[];
  parentId?: string;
}

export const syncSelectedRecordsToSession = async ({
  tab,
  selectedRecords,
  parentId,
}: SessionSyncOptions): Promise<void> => {
  try {
    if (selectedRecords.length === 0) {
      return;
    }

    // Find entity key column (same logic as useFormInitialization)
    const entityKeyColumn = Object.values(tab.fields).find((field) => field?.column?.keyColumn);

    if (!entityKeyColumn) {
      logger.warn(`No key column found for tab ${tab.id}`);
      return;
    }

    // Use the last selected record for the query string
    const lastSelectedRecord = selectedRecords[selectedRecords.length - 1];
    const lastSelectedId = String(lastSelectedRecord.id);

    // Build parameters for SETSESSION mode with last selected record
    const params = buildFormInitializationParams({
      tab,
      mode: SessionMode.SETSESSION,
      recordId: lastSelectedId,
      parentId: parentId || null,
    });

    // Build payload with all selected record IDs
    const allSelectedIds = selectedRecords.map((record) => String(record.id));
    const payload = buildFormInitializationPayload(
      tab,
      SessionMode.SETSESSION,
      {}, // No parent data needed for session sync
      entityKeyColumn
    );

    // Add multiple row IDs to payload when more than one record is selected
    if (selectedRecords.length > 1) {
      // TODO: use a constant for 'MULTIPLE_ROW_IDS'
      payload.MULTIPLE_ROW_IDS = allSelectedIds;
    }

    // Send single request with all selected record information
    // TODO: update the session
    await fetchFormInitialization(params, payload);

    logger.info(`Successfully synced ${selectedRecords.length} records to session`);
  } catch (error) {
    logger.error("Failed to sync selected records to session:", error);
    // Don't throw - session sync should not break selection functionality
  }
};
