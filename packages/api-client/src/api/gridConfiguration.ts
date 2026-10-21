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

import { Metadata } from "./metadata";

export const GRID_CONFIGURATION_PATH = "meta/grid-configuration";

/** Grid configuration of every tab of a window, keyed by tab id. The tab value is opaque to the server. */
export type WindowGridConfiguration<T> = Record<string, T>;

/** Payload returned by the grid configuration endpoint. */
export interface GridConfigurationResponse<T> {
  windowId: string;
  configuration: WindowGridConfiguration<T>;
}

/** Fetches the grid configuration the current user stored for the tabs of a window (AD_Preference). */
export async function fetchGridConfiguration<T>(windowId: string): Promise<GridConfigurationResponse<T>> {
  const params = new URLSearchParams({ windowId });
  const response = await Metadata.client.request(`${GRID_CONFIGURATION_PATH}?${params}`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch grid configuration: ${response.status}`);
  }
  return response.data as GridConfigurationResponse<T>;
}

/** Replaces the stored grid configuration of one tab, or removes it when `configuration` is null. */
export async function saveGridConfiguration<T>(
  windowId: string,
  tabId: string,
  configuration: T | null
): Promise<GridConfigurationResponse<T>> {
  const response = await Metadata.client.request(GRID_CONFIGURATION_PATH, {
    method: "PUT",
    body: JSON.stringify({ windowId, tabId, configuration }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to save grid configuration: ${response.status}`);
  }
  return response.data as GridConfigurationResponse<T>;
}
