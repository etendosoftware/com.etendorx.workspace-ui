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

export type PreferencesMap = Record<string, string>;

/**
 * Fetches all resolved preferences for the current user session from the backend.
 * This replicates the classic OB.PropertyStore behavior, exposing preferences
 * that are used in display logic expressions.
 *
 * @returns A map of preference key -> value pairs
 */
export const getPreferences = async (): Promise<PreferencesMap> => {
  const response = await Metadata.client.request(PREFERENCES_PATH);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: HTTP ${response.status}`);
  }

  return response.data?.preferences ?? {};
};

export const PREFERENCES_PATH = "meta/preferences";

/**
 * Stores a Property List preference for the current user (client, organization, user and role), as classic
 * `OB.PropertyStore.set` does through `StorePropertyActionHandler`.
 *
 * @param property - Property List value, e.g. `OBUIAPP_ShowImplicitFilterMsg`
 * @param value - Value to store
 * @param windowId - AD window id to scope the preference to; global when omitted
 */
export const savePreference = async (property: string, value: string, windowId?: string): Promise<void> => {
  const response = await Metadata.client.request(PREFERENCES_PATH, {
    method: "POST",
    body: JSON.stringify({ property, value, windowId }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to save preference ${property}: HTTP ${response.status}`);
  }
};
