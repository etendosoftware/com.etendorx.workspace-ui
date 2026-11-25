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

/**
 * Default saved views of the tabs of a window, loaded with a single request when the window opens, as the
 * classic window settings return the personalization of every tab before the grids load. The grids wait for
 * them (see `stores/initialViewStore.ts`), so the first load already uses the default view.
 */

import { useUserStore } from "@/stores/userStore";
import { logger } from "@/utils/logger";
import { loadWindowGridConfiguration } from "@/utils/savedViews/gridConfiguration";
import { parseGridConfiguration, rawRecordToSavedView } from "@/utils/savedViews/transform";
import type { MRTViewConfig, RawSavedViewRecord } from "@/utils/savedViews/types";
import { registerSessionReset } from "@/utils/session/resetSessionState";
import { getWindowIdFromIdentifier } from "@/utils/window/utils";
import { isExternalPageWindowId } from "@/utils/menu/externalMenuEntry";

export const SAVED_VIEWS_URL = "/api/meta/saved-views";

/** Default view of each tab of a window, by tab id; tabs without one are absent. */
export type WindowDefaultViews = Record<string, MRTViewConfig>;

const NO_DEFAULT_VIEWS: WindowDefaultViews = {};

/** One request per opened window (the identifier is unique per open), shared by all its tabs. */
const windowDefaultViews = new Map<string, Promise<WindowDefaultViews>>();
/** Answers already received, so a grid can know on its first render whether its tab has a default view. */
const settledDefaultViews = new Map<string, WindowDefaultViews>();
registerSessionReset(() => {
  windowDefaultViews.clear();
  settledDefaultViews.clear();
});

/** Default views of a saved-views response, by tab. A view whose configuration cannot be read is left out. */
export const toDefaultViewsByTab = (records: RawSavedViewRecord[]): WindowDefaultViews => {
  const viewsByTab: WindowDefaultViews = {};
  for (const record of records) {
    const view = rawRecordToSavedView(record);
    const config = parseGridConfiguration(view.gridConfiguration);
    if (config) {
      viewsByTab[view.tabId] = config;
    } else {
      logger.warn("[defaultViews] Default view has no parseable config:", view.name);
    }
  }
  return viewsByTab;
};

const fetchWindowDefaultViews = async (windowIdentifier: string, token: string): Promise<WindowDefaultViews> => {
  const windowId = getWindowIdFromIdentifier(windowIdentifier);
  try {
    const res = await fetch(`${SAVED_VIEWS_URL}?window=${encodeURIComponent(windowId)}&isdefault=true`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      logger.warn("[defaultViews] Failed to fetch the default views of window:", windowId, res.status);
      return NO_DEFAULT_VIEWS;
    }
    const json = (await res.json()) as { response?: { status?: number; data?: RawSavedViewRecord[] } };
    if (json?.response?.status !== 0) {
      logger.warn("[defaultViews] Non-zero status fetching the default views of window:", windowId);
      return NO_DEFAULT_VIEWS;
    }
    return toDefaultViewsByTab(json.response.data ?? []);
  } catch (error) {
    logger.warn("[defaultViews] Failed to fetch the default views of window:", windowId, error);
    return NO_DEFAULT_VIEWS;
  }
};

const loadWindowDefaultViews = (windowIdentifier: string): Promise<WindowDefaultViews> => {
  const cached = windowDefaultViews.get(windowIdentifier);
  if (cached) return cached;

  const token = useUserStore.getState().token;
  // Without a session nothing can be read, and nothing is cached: the next call with a token fetches them
  if (!token) return Promise.resolve(NO_DEFAULT_VIEWS);

  const request = fetchWindowDefaultViews(windowIdentifier, token);
  windowDefaultViews.set(windowIdentifier, request);
  request.then((viewsByTab) => {
    // A logout in between discarded this request: its answer belongs to the previous session
    if (windowDefaultViews.get(windowIdentifier) === request) {
      settledDefaultViews.set(windowIdentifier, viewsByTab);
    }
  });
  return request;
};

/**
 * Default view of a tab when the views of its window have already answered: `null` when the tab has none,
 * `undefined` while the answer is not there yet.
 */
export const getSettledTabDefaultView = (windowIdentifier: string, tabId: string): MRTViewConfig | null | undefined => {
  const viewsByTab = settledDefaultViews.get(windowIdentifier);
  if (!viewsByTab) return undefined;
  return viewsByTab[tabId] ?? null;
};

/**
 * Default view of a tab. Resolves to null when the tab has none or the views cannot be read, so the grid
 * then loads as if there were no default view.
 */
export const loadTabDefaultView = async (windowIdentifier: string, tabId: string): Promise<MRTViewConfig | null> => {
  const viewsByTab = await loadWindowDefaultViews(windowIdentifier);
  return viewsByTab[tabId] ?? null;
};

/**
 * Starts loading what the grids of a window apply when they open (default views and stored column
 * configuration) as soon as the window opens, in parallel with its metadata, so the grids do not wait for it.
 */
export const prefetchWindowViewSettings = (windowIdentifier: string): void => {
  // In-app pages of external menu entries have no grid
  if (isExternalPageWindowId(getWindowIdFromIdentifier(windowIdentifier))) return;
  // Both loaders swallow their errors: they resolve to "nothing stored"
  loadWindowDefaultViews(windowIdentifier);
  loadWindowGridConfiguration(windowIdentifier);
};
