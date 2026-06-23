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
  buildSessionResetPayload,
  buildSessionAttributes,
  mergeSessionAttributes,
} from "@/utils/hooks/useFormInitialization/utils";
import {
  SessionMode,
  type Tab,
  type EntityData,
  type ISession,
  type Field,
} from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import { buildPayloadByInputName } from "@/utils";

const MULTIPLE_ROW_IDS_KEY = "MULTIPLE_ROW_IDS";

const findEntityKeyColumn = (tab: Tab): Field | undefined =>
  Object.values(tab.fields).find((field) => field?.column?.keyColumn);

export interface SessionSyncOptions {
  tab: Tab;
  selectedRecords: EntityData[];
  parentId?: string;
  setSession: (updater: (prev: ISession) => ISession) => void;
  setSessionSyncLoading: (loading: boolean) => void;
}

export const syncSelectedRecordsToSession = async ({
  tab,
  selectedRecords,
  parentId,
  setSession,
  setSessionSyncLoading,
}: SessionSyncOptions): Promise<void> => {
  try {
    setSessionSyncLoading(true);
    if (selectedRecords.length === 0) {
      return;
    }

    // Find entity key column (same logic as useFormInitialization)
    const entityKeyColumn = findEntityKeyColumn(tab);

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
      payload[MULTIPLE_ROW_IDS_KEY] = allSelectedIds;
    }

    // Always send the last selected record's data so the backend can compute
    // session context attributes that displayLogic depends on.
    const record = buildPayloadByInputName(lastSelectedRecord, tab.fields);
    Object.assign(payload, record);

    // Send single request with all selected record information
    const responseData = await fetchFormInitialization(params, payload);

    if (tab.tabLevel === 0) {
      const sessionAttributes = buildSessionAttributes(responseData);
      const isRootTabCall = params.get("PARENT_ID") === "null";
      setSession((prev) => mergeSessionAttributes(prev, sessionAttributes, isRootTabCall));
    }

    logger.info(`Successfully synced ${selectedRecords.length} records to session`);
  } catch (error) {
    logger.error("Failed to sync selected records to session:", error);
    // Don't throw - session sync should not break selection functionality
  } finally {
    setSessionSyncLoading(false);
  }
};

export interface ClearRecordContextOptions {
  tab: Tab;
  parentId?: string | null;
}

/**
 * Clears the record-scoped context that a previously selected/loaded record left in the
 * server session for this window.
 *
 * Why this is needed: opening or selecting a record runs a FormInitialization that stores
 * record values (e.g. `C_BPartner_ID`) into the classic Tomcat session keyed by
 * `<window>|<COLUMN>`. When a brand new record is later created, columns without their own
 * default (like `C_BPartner_ID`) do not overwrite that stale value, so SQL defaults of
 * sibling columns (e.g. `C_BPartner_Location_ID`, whose default reads `@C_BPartner_ID@`)
 * resolve against the stale value and trigger callouts that the empty request cannot satisfy
 * (NPE in OrderBankAccountAssigner). Sending a SETSESSION with empty values resets that
 * context so the next NEW initialization behaves like the first, clean open.
 *
 * This is best-effort: failures are logged and swallowed so they never block opening a form.
 */
export const clearRecordContextFromSession = async ({ tab, parentId }: ClearRecordContextOptions): Promise<void> => {
  try {
    const entityKeyColumn = findEntityKeyColumn(tab);
    if (!entityKeyColumn) {
      logger.warn(`No key column found for tab ${tab.id}; skipping session context reset`);
      return;
    }

    const params = buildFormInitializationParams({
      tab,
      mode: SessionMode.SETSESSION,
      recordId: null,
      parentId: parentId || null,
    });
    const payload = buildSessionResetPayload(tab, entityKeyColumn);

    await fetchFormInitialization(params, payload);
  } catch (error) {
    logger.error("Failed to clear record context from session:", error);
    // Don't throw - resetting context must never block opening a form.
  }
};
