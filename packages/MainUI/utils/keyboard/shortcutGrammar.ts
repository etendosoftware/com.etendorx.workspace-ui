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

import { CLASSIC_KEYS } from "@/utils/keyboard/defaultShortcuts";
import type { KeyCombination, ShortcutDefinition } from "@/utils/keyboard/shortcutIds";

/** Classic (SmartClient) key names translated to `KeyboardEvent.key` values. */
const CLASSIC_KEY_ALIASES: Record<string, string> = {
  [CLASSIC_KEYS.ARROW_UP]: "ArrowUp",
  [CLASSIC_KEYS.ARROW_DOWN]: "ArrowDown",
  [CLASSIC_KEYS.ARROW_LEFT]: "ArrowLeft",
  [CLASSIC_KEYS.ARROW_RIGHT]: "ArrowRight",
  [CLASSIC_KEYS.PAGE_UP]: "PageUp",
  [CLASSIC_KEYS.PAGE_DOWN]: "PageDown",
};

/** Short labels used to render a combination in a tooltip. */
const KEY_DISPLAY_NAMES: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Delete: "Del",
  Escape: "Esc",
};

const MODIFIER_LABELS = { ctrl: "Ctrl", alt: "Alt", shift: "Shift", space: "Space" } as const;
const MODIFIER_ORDER = ["ctrl", "alt", "shift", "space"] as const;
const COMBINATION_SEPARATOR = "+";

const FUNCTION_KEY = /^f\d{1,2}$/i;
const ASCII_LETTER_OR_DIGIT = /^[a-z0-9]$/i;
/** Physical letter/digit keys: `KeyA`, `Digit1`, `Numpad1`. */
const ALPHANUMERIC_CODE = /^(?:Key|Digit|Numpad)([A-Z0-9])$/;

/**
 * Translates a key name from the classic preference (or a plain `KeyboardEvent.key`) to the
 * canonical form events are compared against: `Arrow_Up` → `ArrowUp`, `f2` → `F2`, `d` → `D`.
 */
export function normalizeShortcutKey(key: string): string {
  const alias = CLASSIC_KEY_ALIASES[key];
  if (alias) return alias;
  if (FUNCTION_KEY.test(key) || key.length === 1) return key.toUpperCase();
  return key;
}

/**
 * Canonical key of a keyboard event. Letters and digits come from `event.key` so the user's
 * layout decides them, as in classic; when a modifier turned the key into another character
 * (Shift+1 → `!`, Alt+A → `å` on macOS) the physical `event.code` is used instead.
 */
export function getEventKey(event: KeyboardEvent): string {
  if (ASCII_LETTER_OR_DIGIT.test(event.key)) return event.key.toUpperCase();
  const match = ALPHANUMERIC_CODE.exec(event.code ?? "");
  if (match) return match[1];
  return normalizeShortcutKey(event.key);
}

/**
 * Exact match, as classic `OB.KeyboardManager.Shortcuts.monitor`: every modifier must be in the
 * state the combination asks for. Meta (Cmd) counts as Ctrl.
 */
export function matchesCombination(event: KeyboardEvent, combination: KeyCombination, isSpacePressed: boolean) {
  const isCtrl = event.ctrlKey || event.metaKey;
  return (
    getEventKey(event) === normalizeShortcutKey(combination.key) &&
    isCtrl === Boolean(combination.ctrl) &&
    event.altKey === Boolean(combination.alt) &&
    event.shiftKey === Boolean(combination.shift) &&
    isSpacePressed === Boolean(combination.space)
  );
}

const isShortcutDefinition = (entry: unknown): entry is ShortcutDefinition => {
  const candidate = entry as ShortcutDefinition | null;
  return typeof candidate?.id === "string" && typeof candidate.keyComb?.key === "string";
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Reads the `OBUIAPP_KeyboardShortcuts` preference value. The backend sends it as a JSON string,
 * but an already parsed array is accepted too. Entries without an id or a key are skipped.
 *
 * @returns The definitions, or `null` when the value is missing, malformed or has no valid entry.
 */
export function parseShortcutPreference(raw: unknown): ShortcutDefinition[] | null {
  const value = typeof raw === "string" ? parseJson(raw) : raw;
  if (!Array.isArray(value)) return null;
  const definitions = value.filter(isShortcutDefinition);
  if (definitions.length === 0) return null;
  return definitions;
}

/** Renders a combination for display, e.g. `Ctrl+Shift+R`, `Alt+Shift+PgUp` or `Ctrl+Space+↑`. */
export function formatCombination(combination: KeyCombination): string {
  const key = normalizeShortcutKey(combination.key);
  const modifiers = MODIFIER_ORDER.filter((modifier) => combination[modifier]).map(
    (modifier) => MODIFIER_LABELS[modifier]
  );
  return [...modifiers, KEY_DISPLAY_NAMES[key] ?? key].join(COMBINATION_SEPARATOR);
}
