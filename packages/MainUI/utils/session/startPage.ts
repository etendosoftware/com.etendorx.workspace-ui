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
import { useWindowStore } from "@/stores/windowStore";
import { getStoredPreference } from "@/utils/propertyStore";
import { CLASSIC_PREFERENCES } from "@/utils/preferences/classicPreferences";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { logger } from "@/utils/logger";

/** Query parameter classic start pages use to point at a tab (`/?tabId=<AD_Tab_ID>`). */
const TAB_ID_PARAM = "tabId";

/**
 * Reads the tab a classic `StartPage` value points at. Classic appends the value to the context URL and
 * opens it with `OB.Utilities.openDirectTab`, so only the `tabId` form has a new-UI equivalent; any other
 * page (a classic servlet) is ignored and the home page stays.
 *
 * @param value - Raw `StartPage` preference value, e.g. `/?tabId=186`
 * @returns The tab id, or `null` when the value does not point at a tab
 */
export function parseStartPageTabId(value: string | undefined): string | null {
  const queryStart = value?.indexOf("?") ?? -1;
  if (!value || queryStart < 0) {
    return null;
  }
  return new URLSearchParams(value.slice(queryStart + 1)).get(TAB_ID_PARAM) || null;
}

/**
 * Opens the window of the `StartPage` preference right after login, as classic `LoginHandler` does. The
 * window opens as from the menu, so its default filters and tab apply. Nothing happens when the preference is not set or does not point at a tab; a tab that cannot be loaded
 * (no access, deleted) leaves the home page, like the classic fallback.
 */
export async function openStartPage(): Promise<void> {
  const tabId = parseStartPageTabId(getStoredPreference(CLASSIC_PREFERENCES.START_PAGE));
  if (!tabId) {
    return;
  }
  try {
    const tab = await Metadata.getTab(tabId);
    useWindowStore.getState().setWindowActive({
      windowIdentifier: getNewWindowIdentifier(tab.window),
      windowData: { title: tab.window$_identifier ?? tab.title, initialized: true },
    });
  } catch (error) {
    logger.warn("Could not open the start page:", error);
  }
}
