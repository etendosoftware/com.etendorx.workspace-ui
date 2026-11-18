/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { resolvePreference } from "@/utils/propertyStore";

/** Preference that turns the automatic save on leaving a record on or off. */
export const AUTOSAVE_PREFERENCE = "Autosave";
/** Preference that makes the automatic save ask before saving. Only matters with Autosave on. */
export const SHOW_CONFIRMATION_PREFERENCE = "ShowConfirmationDefault";

/** What to do with the unsaved changes of a record the user is about to leave. */
export interface AutosavePolicy {
  /** Save the changes on leaving the record. When off, the user decides (save, discard or stay). */
  autosave: boolean;
  /** With `autosave` on, ask before saving. */
  confirm: boolean;
}

/**
 * Reads a boolean preference like Classic's `WindowSettingsActionHandler.getBooleanPreference`:
 * only `Y` is true, any other stored value is false, and a missing preference takes the default.
 */
const readBooleanPreference = (key: string, windowId: string | undefined, defaultValue: boolean): boolean => {
  const raw = resolvePreference(key, windowId);
  if (raw === undefined || raw === null) {
    return defaultValue;
  }
  return String(raw) === "Y";
};

/**
 * The autosave behaviour of a window, with the same defaults as Classic: Autosave on and
 * Show Confirmation Default off. The preferences are resolved for the window, so one window can
 * behave differently from the others.
 *
 * @param windowId - AD window id, when known.
 */
export const getAutosavePolicy = (windowId?: string): AutosavePolicy => {
  const autosave = readBooleanPreference(AUTOSAVE_PREFERENCE, windowId, true);
  const confirm = autosave && readBooleanPreference(SHOW_CONFIRMATION_PREFERENCE, windowId, false);
  return { autosave, confirm };
};
