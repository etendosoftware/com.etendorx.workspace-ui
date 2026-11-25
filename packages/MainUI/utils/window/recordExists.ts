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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { logger } from "@/utils/logger";

/** Record of a tab to look up. */
export interface RecordLookupTarget {
  windowId: string;
  tabId: string;
  recordId: string;
}

/**
 * Datasource parameters that read one record by id: without the implicit filter of the tab (a closed or old
 * document still exists) and with inactive records, so only a deleted record answers no rows.
 */
export function buildRecordLookupParams({ windowId, tabId, recordId }: RecordLookupTarget): Record<string, unknown> {
  return {
    windowId,
    tabId,
    criteria: [{ fieldName: "id", operator: "equals", value: recordId }],
    noActiveFilter: "true",
    startRow: "0",
    endRow: "0",
  };
}

/**
 * Whether a record of a tab still exists. When the answer is unknown (the tab metadata or the datasource
 * cannot be read) the record is taken as existing, so the caller opens it as before and the window reports
 * its own error.
 *
 * @param target - Window, tab and record to look up
 * @returns false only when the datasource answered no rows for the record
 */
export async function recordExists(target: RecordLookupTarget): Promise<boolean> {
  try {
    const windowMetadata = await Metadata.getWindow(target.windowId);
    const entityName = windowMetadata.tabs.find((tab) => tab.id === target.tabId)?.entityName;
    if (!entityName) return true;

    const { ok, data } = (await datasource.get(entityName, buildRecordLookupParams(target))) as {
      ok: boolean;
      data?: { response?: { data?: unknown } };
    };
    const rows = data?.response?.data;
    if (!ok || !Array.isArray(rows)) return true;
    return rows.length > 0;
  } catch (err) {
    logger.warn("[recordExists] Could not check the record, opening it as usual:", err);
    return true;
  }
}
