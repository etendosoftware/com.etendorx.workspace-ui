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

import { getStoredPreference } from "@/utils/propertyStore";

/** Application Dictionary property backing the post-delete grid refresh. */
export const REFRESH_AFTER_DELETION_PREFERENCE = "OBUIAPP_RefreshAfterDeletion";

/** Value a property-list preference carries when enabled. */
export const PREFERENCE_ENABLED_VALUE = "Y";

/**
 * Classic gate for the post-delete grid refetch.
 *
 * Mirrors `OBStandardView.deleteSelectedRows`, which refreshes the grid only when
 * `OB.PropertyStore.get('OBUIAPP_RefreshAfterDeletion', windowId) === 'Y'` and otherwise leaves
 * the client-side row removal as the whole behaviour. The lookup is window-scoped first and
 * global second, so the preference can be enabled per window or for every window at once.
 *
 * Ships enabled for the Preference (129) and Alert (276) windows only.
 *
 * @param windowId - AD window id of the tab the record was deleted from
 * @returns true when the grid must be refetched from the server after a successful delete
 */
export function isRefreshAfterDeletionEnabled(windowId?: string): boolean {
  return getStoredPreference(REFRESH_AFTER_DELETION_PREFERENCE, windowId) === PREFERENCE_ENABLED_VALUE;
}
