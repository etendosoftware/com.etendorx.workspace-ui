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

/**
 * Merges a single preference key into the stored preferences, preserving the
 * rest. Backing for the `OB.PropertyStore.set(key, value)` shim.
 *
 * @param key - Preference key to write
 * @param value - Value to store (coerced to its JSON representation)
 */
export function setStoredPreference(key: string, value: unknown) {
  const prefs = getStoredPreferences();
  prefs[key] = value;
  savePreferences(prefs);
}

/**
 * Looks a key up in the preference map: exact match first, then a case-insensitive scan.
 * The case-insensitive tolerance is not a classic behaviour, it is what the expression engine
 * and the OB shims have always done, and it is preserved here so they can share one resolver.
 *
 * @param prefs - The stored preference map
 * @param key - Preference key to look for
 * @returns The raw stored value, or `undefined` when no key matches
 */
function findPreference(prefs: Record<string, unknown>, key: string): unknown {
  if (prefs[key] !== undefined) return prefs[key];

  const lowerKey = key.toLowerCase();
  for (const storedKey of Object.keys(prefs)) {
    if (storedKey.toLowerCase() === lowerKey) return prefs[storedKey];
  }
  return undefined;
}

/**
 * Resolves a preference exactly as classic `OB.PropertyStore.get(propertyName, windowId)` does:
 * the window-scoped key `${key}_${windowId}` wins, otherwise the global `key`.
 *
 * The window-scoped entry is skipped when its value is falsy — including the empty string the
 * backend writes for a null preference value — matching the classic truthiness check in
 * `ob-property-store.js`.
 *
 * Returns the RAW stored value so each caller keeps its own normalization (the expression engine
 * needs to still see booleans as booleans).
 *
 * @param key - Preference key, without any window suffix
 * @param windowId - AD window id to scope the lookup to, when known
 * @returns The raw stored value, or `undefined` when the preference is not set
 */
export function resolvePreference(key: string, windowId?: string): unknown {
  const prefs = getStoredPreferences();

  if (windowId) {
    const scoped = findPreference(prefs, `${key}_${windowId}`);
    if (scoped) return scoped;
  }

  return findPreference(prefs, key);
}

/**
 * String-coercing wrapper over {@link resolvePreference}, for the `OB.PropertyStore.get` contract.
 *
 * @param key - Preference key, without any window suffix
 * @param windowId - AD window id to scope the lookup to, when known
 * @returns The stored value as a string, or `undefined` when the preference is not set
 */
export function getStoredPreference(key: string, windowId?: string): string | undefined {
  const value = resolvePreference(key, windowId);
  if (value === undefined) return undefined;
  return String(value);
}

// NOTE: `createOBShim` (the full OB.* shim) now lives in `utils/ob/obShim.ts`.
// Import it from there directly.
