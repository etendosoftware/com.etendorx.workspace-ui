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
import { FORM_MODES, TAB_MODES } from "@/utils/url/constants";
import type { TabState, WindowState } from "@/utils/window/constants";
import type { ParsedUrlState } from "@/utils/recovery/urlStateParser";
import { calculateHierarchy } from "@/utils/recovery/hierarchyCalculator";
import { reconstructState } from "@/utils/recovery/stateReconstructor";
import { createDefaultTabState } from "@/utils/window/utils";

export interface RecordWindowTarget {
  windowIdentifier: string;
  windowId: string;
  tabId: string;
  title: string;
  recordId: string;
  /** Level of the tab, used when the window metadata does not know it or the reconstruction fails. */
  tabLevel?: number;
}

/**
 * Window state that opens a window on a record of one of its tabs.
 *
 * Reuses the hierarchy calculation and state reconstruction of the page-reload recovery, so the parent tabs
 * of a sub-tab get their selected record and filters too. When that fails, falls back to the target tab
 * alone, showing the record in its form.
 *
 * @param target - Window, tab and record to open
 * @returns The `windowData` to pass to `setWindowActive`
 */
export async function buildRecordWindowData({
  windowIdentifier,
  windowId,
  tabId,
  title,
  recordId,
  tabLevel = 0,
}: RecordWindowTarget): Promise<Partial<WindowState>> {
  try {
    const windowMetadata = await Metadata.getWindow(windowId);
    const targetTab = windowMetadata.tabs.find((t) => t.id === tabId);

    const parsedState: ParsedUrlState = {
      windowIdentifier,
      tabId,
      recordId,
      windowId,
      tabTitle: title,
      tabLevel: targetTab?.tabLevel ?? tabLevel,
      keyParameter: "",
    };

    const hierarchy = await calculateHierarchy(parsedState, windowMetadata);
    const reconstructed = await reconstructState(hierarchy, windowMetadata);

    return { title, tabs: reconstructed.tabs, navigation: reconstructed.navigation, initialized: true };
  } catch (err) {
    console.warn("[useRedirect] Hierarchy reconstruction failed, falling back to single-tab state:", err);
    const defaultTabState = createDefaultTabState(tabLevel);
    const tabs = {
      [tabId]: {
        ...defaultTabState,
        form: {
          recordId,
          mode: TAB_MODES.FORM,
          formMode: FORM_MODES.EDIT,
        },
        selectedRecord: recordId,
      } as TabState,
    };
    return { title, tabs };
  }
}
