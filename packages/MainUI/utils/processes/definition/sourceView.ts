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

import type { Tab } from "@workspaceui/api-client/src/api/types";
import { buildProcessPayload } from "@/utils";

/** The launching tab surfaced to process scripts as `view.sourceView`. */
export type SourceView = Tab & { getContextInfo: () => Record<string, unknown> };

/**
 * Builds `view.sourceView`: the tab the process was launched from, plus the
 * classic `getContextInfo()` of its selected record. As in classic
 * `OBStandardView.getContextInfo()`, the context carries the record values by
 * input name, the tab's standard properties (`inpTabId`, `inpwindowId`,
 * `inpKeyName`, …) and the key column by its DB column name (e.g.
 * `Fin_Financial_Account_ID`), which action handlers read from the
 * `context` request parameter. The context is computed on each call.
 */
export function buildSourceView(
  tab: Tab | null | undefined,
  record: Record<string, unknown> | null | undefined
): SourceView | undefined {
  if (!tab) {
    return undefined;
  }
  return { ...tab, getContextInfo: () => buildProcessPayload(record ?? {}, tab) };
}
