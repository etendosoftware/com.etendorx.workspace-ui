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

import type { EntityValue, ISession, Tab } from "@workspaceui/api-client/src/api/types";
import { buildTabStandardContext } from "@/utils";

/**
 * Builds the body of the `DefaultsProcessActionHandler` request: the context of
 * the tab the process was launched from. As in Classic (`getUnderLyingRecordContext`
 * → `buttonOwnerView.getContextInfo()`), it carries the tab's standard properties
 * (`inpwindowId`, `inpTabId`, the key column, …) so default and filter
 * expressions reading them resolve. They go first, so the record values and the
 * session keep their values for every key sent before.
 */
export function buildDefaultsRequestPayload(
  tab: Tab | null | undefined,
  record: Record<string, unknown> | null | undefined,
  recordValues: Record<string, EntityValue> | null,
  session: ISession
): Record<string, EntityValue> {
  const tabContext = tab ? (buildTabStandardContext(record ?? {}, tab) as Record<string, EntityValue>) : {};
  return { ...tabContext, ...recordValues, ...session };
}
