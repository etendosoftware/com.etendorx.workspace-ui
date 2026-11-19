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

import { savePreference } from "@workspaceui/api-client/src/api/getPreferences";
import { buildPreferenceKey, setStoredPreference } from "@/utils/propertyStore";
import { logger } from "@/utils/logger";

/**
 * Stores a preference as classic `OB.PropertyStore.set(name, value, windowId)` does: at once in the
 * preferences of the session, under `name_windowId` when a window is given, and for the current user in the
 * server, so it is kept in the next sessions. A failed save is logged; the session keeps the new value.
 *
 * @param name - Property List value
 * @param value - Value to store
 * @param windowId - AD window id to scope the preference to; global when omitted
 */
export async function persistPreference(name: string, value: string, windowId?: string): Promise<void> {
  setStoredPreference(buildPreferenceKey(name, windowId), value);
  try {
    await savePreference(name, value, windowId);
  } catch (error) {
    logger.warn(`Could not save the preference ${name}:`, error);
  }
}
