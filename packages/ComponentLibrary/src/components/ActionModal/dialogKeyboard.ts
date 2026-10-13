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

import type { KeyboardEvent } from "react";

const ENABLED_BUTTON_SELECTOR = "button:not([disabled])";
const TAB_KEY = "Tab";
const ESCAPE_KEY = "Escape";

/** The first enabled button inside `container`, where the focus lands when the dialog opens. */
export function findFirstEnabledButton(container: HTMLElement | null): HTMLButtonElement | null {
  return container?.querySelector<HTMLButtonElement>(ENABLED_BUTTON_SELECTOR) ?? null;
}

/** Tab past the last button (Shift+Tab before the first) wraps around instead of leaving the dialog. */
export function keepTabInDialog(event: KeyboardEvent<HTMLElement>, dialog: HTMLElement): void {
  const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>(ENABLED_BUTTON_SELECTOR));
  if (buttons.length === 0) {
    event.preventDefault();
    return;
  }
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  const edge = event.shiftKey ? first : last;
  const isLeaving = document.activeElement === edge || !dialog.contains(document.activeElement);
  if (!isLeaving) return;
  event.preventDefault();
  const wrapTo = event.shiftKey ? last : first;
  wrapTo.focus();
}

/**
 * Keyboard of a modal dialog: Tab stays inside, Escape closes it (unless `canClose` is false), and no
 * key reaches the page shortcuts behind it (Enter keeps activating the focused button).
 */
export function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>, onClose: () => void, canClose: boolean): void {
  // The React root can be the document itself (Next app router), where the page shortcuts also
  // listen: only stopping the immediate propagation keeps them from seeing the key.
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
  if (event.key === TAB_KEY) {
    keepTabInDialog(event, event.currentTarget);
    return;
  }
  if (event.key === ESCAPE_KEY && canClose) {
    event.preventDefault();
    onClose();
  }
}
