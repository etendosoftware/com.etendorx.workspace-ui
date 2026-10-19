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

export const RECENT_ITEMS_PATH = "meta/recent-items";

/** Recent items list persisted server-side (AD_Preference) and the size it is trimmed to. */
export interface RecentItemsResponse<T> {
  items: T[];
  size: number;
}

/** Fetches the recent items of the current user + role + client + organization. */
export async function fetchRecentItems<T>(): Promise<RecentItemsResponse<T>> {
  const response = await Metadata.client.request(RECENT_ITEMS_PATH, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch recent items: ${response.status}`);
  }
  return response.data as RecentItemsResponse<T>;
}

/** Stores the whole recent items list (newest first); the backend trims it to the configured size. */
export async function saveRecentItems<T>(items: T[]): Promise<RecentItemsResponse<T>> {
  const response = await Metadata.client.request(RECENT_ITEMS_PATH, {
    method: "POST",
    body: JSON.stringify({ items }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to save recent items: ${response.status}`);
  }
  return response.data as RecentItemsResponse<T>;
}
