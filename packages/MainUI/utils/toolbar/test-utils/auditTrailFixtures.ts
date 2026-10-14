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

import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

/** Shared fixtures for the Audit Trail toolbar tests. */
export const AUDITED_TAB = { id: "tab-1", table: "table-1", uIPattern: "STD", tableFullyAudited: true } as Tab;
export const NOT_AUDITED_TAB = { ...AUDITED_TAB, tableFullyAudited: false } as Tab;

const CREATED_AT = "2026-10-01T10:00:00-03:00";

export const makeAuditRecord = (id: string, updated = CREATED_AT): EntityData =>
  ({ id, creationDate: CREATED_AT, updated }) as EntityData;

/** Saved and later modified: the only selection that enables the Audit Trail. */
export const MODIFIED_RECORD = makeAuditRecord("rec-1", "2026-10-02T11:30:00-03:00");
/** Saved but never modified (`updated` equals `creationDate`). */
export const UNMODIFIED_RECORD = makeAuditRecord("rec-2");
