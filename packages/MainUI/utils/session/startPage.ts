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
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useWindowStore } from "@/stores/windowStore";
import { getStoredPreference } from "@/utils/propertyStore";
import { CLASSIC_PREFERENCES } from "@/utils/preferences/classicPreferences";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import type { WindowState } from "@/utils/window/constants";
import { buildRecordWindowData } from "@/utils/window/recordWindowData";
import { createDefaultTabState, getNewTabFormState, getNewWindowIdentifier } from "@/utils/window/utils";
import { logger } from "@/utils/logger";

/** Query parameters of a classic start page (`/?tabId=<AD_Tab_ID>&recordId=<id>&command=NEW`). */
const START_PAGE_PARAMS = { TAB_ID: "tabId", RECORD_ID: "recordId", COMMAND: "command" } as const;

/** Classic `OBStandardWindow.COMMAND_NEW`: opens the window on a new record of its top tab. */
const COMMAND_NEW = "NEW";

/** What a classic `StartPage` value asks to open, as `OB.Utilities.openDirectTab(tabId, recordId, command)`. */
export interface StartPageTarget {
  tabId: string;
  recordId?: string;
  isNewRecord: boolean;
}

/**
 * Reads what a classic `StartPage` value points at. Classic appends the value to the context URL and opens
 * it with `OB.Utilities.openDirectTab`, so only the `tabId` form has a new-UI equivalent; any other page (a
 * classic servlet) is ignored and the home page stays.
 *
 * @param value - Raw `StartPage` preference value, e.g. `/?tabId=186&recordId=...` or `/?tabId=186&command=NEW`
 * @returns The tab, record and command, or `null` when the value does not point at a tab
 */
export function parseStartPage(value: string | undefined): StartPageTarget | null {
  const queryStart = value?.indexOf("?") ?? -1;
  if (!value || queryStart < 0) {
    return null;
  }
  const params = new URLSearchParams(value.slice(queryStart + 1));
  const tabId = params.get(START_PAGE_PARAMS.TAB_ID);
  if (!tabId) {
    return null;
  }
  return {
    tabId,
    recordId: params.get(START_PAGE_PARAMS.RECORD_ID) || undefined,
    isNewRecord: params.get(START_PAGE_PARAMS.COMMAND) === COMMAND_NEW,
  };
}

/**
 * Window state of a new record. As in classic ("new is only supported for the top tab"), the record is
 * created in the top tab of the window, whatever tab the start page names.
 */
async function buildNewRecordWindowData(windowId: string, title: string): Promise<Partial<WindowState>> {
  const windowMetadata = await Metadata.getWindow(windowId);
  const topTab = windowMetadata.tabs.find((tab) => tab.tabLevel === 0);
  if (!topTab) {
    return { title, initialized: true };
  }
  return {
    title,
    tabs: { [topTab.id]: { ...createDefaultTabState(0), form: getNewTabFormState(NEW_RECORD_ID) } },
  };
}

/** Window state for the start page: a new record, a record, or the window as opened from the menu. */
function buildStartPageWindowData(
  target: StartPageTarget,
  tab: Tab,
  windowIdentifier: string,
  title: string
): Promise<Partial<WindowState>> {
  if (target.isNewRecord) {
    return buildNewRecordWindowData(tab.window, title);
  }
  if (target.recordId) {
    return buildRecordWindowData({
      windowIdentifier,
      windowId: tab.window,
      tabId: tab.id,
      title,
      recordId: target.recordId,
      tabLevel: tab.tabLevel,
    });
  }
  return Promise.resolve({ title, initialized: true });
}

/**
 * Opens the `StartPage` preference right after login, as classic `LoginHandler` does: the window of the tab
 * as from the menu, the record of `recordId` in its form, or a new record with `command=NEW`. Nothing
 * happens when the preference is not set or does not point at a tab; a tab that cannot be loaded (no access,
 * deleted) leaves the home page, like the classic fallback.
 */
export async function openStartPage(): Promise<void> {
  const target = parseStartPage(getStoredPreference(CLASSIC_PREFERENCES.START_PAGE));
  if (!target) {
    return;
  }
  try {
    const tab = await Metadata.getTab(target.tabId);
    const windowIdentifier = getNewWindowIdentifier(tab.window);
    const title = tab.window$_identifier ?? tab.title;
    const windowData = await buildStartPageWindowData(target, tab, windowIdentifier, title);
    useWindowStore.getState().setWindowActive({ windowIdentifier, windowData });
  } catch (error) {
    logger.warn("Could not open the start page:", error);
  }
}
