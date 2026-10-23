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

import { useEffect, useRef } from "react";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { isInputTarget } from "@/hooks/useKeyboardShortcuts";
import { useWindowStore } from "@/stores/windowStore";
import { matchesCombination } from "@/utils/keyboard/shortcutGrammar";
import type { ShortcutId } from "@/utils/keyboard/shortcutIds";
import { getCombinationsFor, getEffectiveShortcuts } from "@/utils/keyboard/shortcutRegistry";
import { installSpaceChordTracker, isSpacePressed } from "@/utils/keyboard/spaceChordTracker";

export interface ShortcutBinding {
  handler: (event: KeyboardEvent) => void | Promise<void>;
  /** Fire even when the focus is in a text field (save, save and close, undo). */
  allowInInputs?: boolean;
  /**
   * Narrows the binding to a surface (the grid body, a filter row...). A key press out of scope is
   * left untouched, so another binding of the same keys (or the browser) can still take it.
   */
  isInScope?: (event: KeyboardEvent) => boolean;
}

export type ShortcutBindings = Partial<Record<ShortcutId, ShortcutBinding>>;

/**
 * Marks the application layout. Key presses coming from elements outside it — modals, menus and
 * popovers rendered in portals — never fire shortcuts of the screen underneath.
 */
export const SHORTCUT_ROOT_ATTRIBUTE = "data-shortcut-root";

/**
 * True when the event comes from an element rendered outside the layout (a portal). Without a
 * marked layout in the document (isolated renders) nothing is considered outside.
 */
export function isOutsideShortcutRoot(target: EventTarget | null): boolean {
  if (!(target instanceof Element) || target === document.body) return false;
  if (!document.querySelector(`[${SHORTCUT_ROOT_ATTRIBUTE}]`)) return false;
  return !target.closest(`[${SHORTCUT_ROOT_ATTRIBUTE}]`);
}

function canFire(binding: ShortcutBinding, event: KeyboardEvent): boolean {
  if (isInputTarget(event.target) && !binding.allowInInputs) return false;
  if (isOutsideShortcutRoot(event.target)) return false;
  return binding.isInScope?.(event) ?? true;
}

/**
 * The first binding whose classic combination (or its `_Alternative`) the event matches and that
 * may fire from where the event comes.
 */
export function findShortcutBinding(bindings: ShortcutBindings, event: KeyboardEvent): ShortcutBinding | undefined {
  const table = getEffectiveShortcuts();
  const spacePressed = isSpacePressed();
  const matches = (id: string) =>
    getCombinationsFor(id, table).some((combination) => matchesCombination(event, combination, spacePressed));
  const match = Object.entries(bindings).find(([id, binding]) => binding && matches(id) && canFire(binding, event));
  return match?.[1];
}

/**
 * Whether the window this component belongs to is the visible one. Hidden windows stay mounted,
 * so their shortcuts must not fire. Outside a window (or before it is registered) it is true.
 */
export function useIsCurrentWindowActive(): boolean {
  const windowIdentifier = useCurrentWindowIdentifier();
  return useWindowStore((state) => !windowIdentifier || state.windows?.[windowIdentifier]?.isActive !== false);
}

/**
 * Binds classic keyboard shortcuts, by id, to handlers. The combinations come from the
 * `OBUIAPP_KeyboardShortcuts` preference (classic default when missing), so changing the
 * preference changes the keys without touching code.
 *
 * - Only fires while `enabled` and while the owning window is the active one.
 * - Skips text fields unless the binding allows them, key presses from portals and, when the
 *   binding has a scope, key presses outside it.
 * - Prevents the browser default, and ignores events another handler already consumed
 *   (`defaultPrevented`), so one key press runs a single shortcut.
 */
export function useShortcutBindings(bindings: ShortcutBindings, enabled = true): void {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const isWindowActive = useIsCurrentWindowActive();
  const isActive = enabled && isWindowActive;

  useEffect(() => {
    if (!isActive) return;
    installSpaceChordTracker();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const binding = findShortcutBinding(bindingsRef.current, event);
      if (!binding) return;

      event.preventDefault();
      binding.handler(event);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);
}
