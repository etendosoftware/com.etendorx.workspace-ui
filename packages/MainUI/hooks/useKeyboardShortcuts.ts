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

import { type RefObject, useEffect, useRef } from "react";

export interface ShortcutConfig {
  handler: (event: KeyboardEvent) => void | Promise<void>;
  allowInInputs?: boolean;
  preventDefault?: boolean;
}

export type ShortcutMap = Record<string, ShortcutConfig>;

function normalizeKey(event: KeyboardEvent): string {
  const isCtrl = event.ctrlKey || event.metaKey;
  if (isCtrl) {
    return `ctrl+${event.key.toLowerCase()}`;
  }
  return event.key;
}

/**
 * Ctrl+Shift combinations only match `ctrl+shift+<key>`: a `ctrl+<key>` shortcut must not take
 * them, since they are other classic shortcuts (e.g. Ctrl+Shift+M is Email, Ctrl+M is split view).
 */
function findShortcut(shortcuts: ShortcutMap, event: KeyboardEvent): ShortcutConfig | undefined {
  const isCtrl = event.ctrlKey || event.metaKey;
  if (isCtrl && event.shiftKey) {
    return shortcuts[`ctrl+shift+${event.key.toLowerCase()}`];
  }
  return shortcuts[normalizeKey(event)];
}

export function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.getAttribute("contenteditable") === "true";
}

/** Elements that act on Enter and the arrow keys by themselves: buttons, links, menu items, tabs, etc. */
const INTERACTIVE_TARGET_SELECTOR = [
  "button",
  "a[href]",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='tab']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='option']",
  "[role='combobox']",
].join(",");

/** Whether `target` is a control that handles Enter and the arrow keys by itself. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
}

interface UseKeyboardShortcutsOptions {
  /**
   * Limits the shortcuts to a region of the screen: a key pressed on a control outside it (a toolbar button,
   * the top bar, a menu) is left to that control, as the shortcuts of a grid must not take its Enter or its
   * arrow keys. A key pressed anywhere else, such as the page body, still triggers them.
   */
  scopeRef?: RefObject<HTMLElement | null>;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled = true,
  options?: UseKeyboardShortcutsOptions
): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  const scopeRef = options?.scopeRef;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const config = findShortcut(shortcutsRef.current, event);

      if (!config) return;

      if (isInputTarget(event.target) && !config.allowInInputs) return;

      const scope = scopeRef?.current;
      if (scope && isInteractiveTarget(event.target) && !scope.contains(event.target as Node)) return;

      if (config.preventDefault !== false) {
        event.preventDefault();
      }

      config.handler(event);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, scopeRef]);
}
