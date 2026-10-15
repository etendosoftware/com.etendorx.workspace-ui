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
 *************************************************************************
 */

import { resolvePreference } from "@/utils/propertyStore";
import { ALERT_SHORTCUT_ID, DEFAULT_ALERT_SHORTCUT, KEYBOARD_SHORTCUTS_PREFERENCE } from "./constants";

/** Key combination of a classic keyboard shortcut (`UINAVBA_KeyboardShortcuts` entry). */
export interface ClassicKeyComb {
  key?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

interface ClassicShortcut {
  id?: string;
  keyComb?: ClassicKeyComb;
}

const FUNCTION_KEY_PATTERN = /^f\d{1,2}$/i;

/**
 * Reads a classic shortcut list, stored either as its JSON source or already parsed.
 *
 * @param raw - Stored preference value
 * @returns The shortcut entries, or an empty list when the value is missing or malformed
 */
export function parseShortcutList(raw: unknown): ClassicShortcut[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "string") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Translates a classic key combination into a `useKeyboardShortcuts` key.
 *
 * @param keyComb - Classic key combination
 * @returns The shortcut key, or `null` when the combination cannot be expressed (Alt/Shift or no key)
 */
export function toShortcutKey(keyComb?: ClassicKeyComb): string | null {
  const key = keyComb?.key;
  if (!key || keyComb.alt || keyComb.shift) {
    return null;
  }
  if (keyComb.ctrl) {
    return `ctrl+${key.toLowerCase()}`;
  }
  if (FUNCTION_KEY_PATTERN.test(key)) {
    return key.toUpperCase();
  }
  return key;
}

/**
 * Resolves the alerts indicator shortcut from the `UINAVBA_KeyboardShortcuts` preference, falling
 * back to the classic default (F8) when it is not configured or not supported.
 */
export function resolveAlertShortcut(): string {
  const shortcuts = parseShortcutList(resolvePreference(KEYBOARD_SHORTCUTS_PREFERENCE));
  const alertShortcut = shortcuts.find((shortcut) => shortcut?.id === ALERT_SHORTCUT_ID);
  return toShortcutKey(alertShortcut?.keyComb) ?? DEFAULT_ALERT_SHORTCUT;
}
