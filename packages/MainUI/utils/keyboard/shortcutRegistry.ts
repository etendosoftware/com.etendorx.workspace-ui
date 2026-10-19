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
import { DEFAULT_KEYBOARD_SHORTCUTS } from "@/utils/keyboard/defaultShortcuts";
import {
  type KeyEventLike,
  formatCombination,
  matchesCombination,
  parseShortcutPreference,
} from "@/utils/keyboard/shortcutGrammar";
import { isSpacePressed } from "@/utils/keyboard/spaceChordTracker";
import {
  ALTERNATIVE_SHORTCUT_SUFFIX,
  KEYBOARD_SHORTCUTS_PREFERENCE,
  type KeyCombination,
} from "@/utils/keyboard/shortcutIds";

type ShortcutTable = Map<string, KeyCombination>;

let cachedSource: unknown;
let cachedTable: ShortcutTable | null = null;

const buildTable = (definitions: readonly { id: string; keyComb: KeyCombination }[]): ShortcutTable =>
  new Map(definitions.map((definition) => [definition.id, definition.keyComb]));

/**
 * The effective shortcut table, id → combination. Like classic, the preference value replaces the
 * whole list (an id it leaves out has no keys); when the preference is missing or malformed the
 * classic default is used. Rebuilt only when the stored preference value changes, so a new value
 * loaded with the session preferences takes effect on the next key press.
 */
export function getEffectiveShortcuts(): ShortcutTable {
  const source = resolvePreference(KEYBOARD_SHORTCUTS_PREFERENCE);
  if (cachedTable && source === cachedSource) return cachedTable;
  cachedSource = source;
  cachedTable = buildTable(parseShortcutPreference(source) ?? DEFAULT_KEYBOARD_SHORTCUTS);
  return cachedTable;
}

/** The primary combination of a shortcut followed by its `_Alternative`, when they are defined. */
export function getCombinationsFor(id: string, table: ShortcutTable = getEffectiveShortcuts()): KeyCombination[] {
  return [table.get(id), table.get(`${id}${ALTERNATIVE_SHORTCUT_SUFFIX}`)].filter(
    (combination): combination is KeyCombination => Boolean(combination)
  );
}

/**
 * Whether a key press is the shortcut `id` (or its alternative). Meant for field-local handlers,
 * which receive the key press themselves instead of binding through `useShortcutBindings`.
 */
export function matchesShortcut(event: KeyEventLike, id: string): boolean {
  const spacePressed = isSpacePressed();
  return getCombinationsFor(id).some((combination) => matchesCombination(event, combination, spacePressed));
}

/** Display text of the primary combination of a shortcut, e.g. `Ctrl+Shift+R`. */
export function getShortcutLabel(id: string): string | undefined {
  const combination = getEffectiveShortcuts().get(id);
  if (!combination) return undefined;
  return formatCombination(combination);
}

/** Appends the shortcut of `id` to a tooltip text: `Refresh (Ctrl+Shift+R)`. */
export function withShortcutHint(text: string, id?: string): string {
  const label = id ? getShortcutLabel(id) : undefined;
  if (!text || !label) return text;
  return `${text} (${label})`;
}
