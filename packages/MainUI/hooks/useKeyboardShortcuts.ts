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

function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.getAttribute("contenteditable") === "true";
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true): void {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = normalizeKey(event);
      const config = shortcutsRef.current[normalizedKey];

      if (!config) return;

      if (isInputTarget(event.target) && !config.allowInInputs) return;

      if (config.preventDefault !== false) {
        event.preventDefault();
      }

      config.handler(event);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
