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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 * ************************************************************************
 */

/**
 * Utility to manage Etendo preferences in localStorage.
 * These are used by the expression engine (OB.PropertyStore.get shim)
 * to evaluate display logic and other client-side expressions.
 */

export const PREFERENCES_KEY = "etendo_preferences";

/**
 * Saves preferences to localStorage
 * @param prefs - Record of preference values from the backend
 */
export function savePreferences(prefs: Record<string, any>) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn("Failed to save preferences to localStorage:", e);
    }
  }
}

/**
 * Clears preferences from localStorage
 */
export function clearPreferences() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(PREFERENCES_KEY);
    } catch (e) {
      console.warn("Failed to clear preferences from localStorage:", e);
    }
  }
}

/**
 * Retrieves preferences from localStorage
 * @returns Record of preferences or empty object
 */
export function getStoredPreferences(): Record<string, any> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn("Failed to retrieve or parse preferences from localStorage:", e);
      return {};
    }
  }
  return {};
}
