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

/** Saved-view records and `/api/meta/saved-views` responses shared by the saved-view tests. */

import type { RawSavedViewRecord } from "@/utils/savedViews/types";

export const DEFAULT_VIEW_TAB_ID = "tab-abc";

/** Grid configuration of a view: a filter, a sort and the implicit filter applied. */
export const VALID_GRID_CONFIG = JSON.stringify({
  version: 1,
  source: "workspace-ui",
  filters: [{ id: "status", value: "active" }],
  visibility: { status: true },
  sorting: [{ id: "status", desc: false }],
  order: ["status"],
  implicitFilterApplied: true,
});

/** Raw default view record of {@link DEFAULT_VIEW_TAB_ID}, as the backend answers it. */
export function makeDefaultViewRecord(overrides: Partial<RawSavedViewRecord> = {}): RawSavedViewRecord {
  return {
    id: "view-001",
    name: "Default View",
    tab: DEFAULT_VIEW_TAB_ID,
    user: "100",
    isdefault: true,
    filterclause: "",
    gridconfiguration: VALID_GRID_CONFIG,
    ...overrides,
  };
}

/** Successful saved-views response with the given records. */
export function makeSavedViewsResponse(data: unknown[], status = 0): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ response: { status, data, totalRows: data.length } }),
  } as Response);
}

/** Failed HTTP response. */
export function makeErrorResponse(status = 500): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "Server error" }),
  } as Response);
}
