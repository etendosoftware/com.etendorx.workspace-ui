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

import { type KeyboardEvent as ReactKeyboardEvent, type RefObject, useCallback, useEffect, useRef } from "react";

/** Frames to wait for the content of a popup to become visible before the focus goes to the container. */
const MAX_FOCUS_ATTEMPTS = 30;

/** Elements the keyboard can reach: links, buttons, fields and anything with a tabindex other than -1. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

/**
 * Elements of `container` the keyboard can reach, in DOM order. Hidden ones are left out: those inside a
 * `hidden`, `inert` or `aria-hidden` branch, and those with `display: none` or `visibility: hidden`.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

const focusReturnTargets = new WeakMap<Element, HTMLElement>();

/**
 * Tells where the focus should go back to for whatever is opened from inside \`popup\`. A menu item that opens a
 * dialog is removed when the menu closes, so the dialog could not give the focus back to it: it gives it back
 * to the button that opened the menu instead.
 */
export function setFocusReturnTarget(popup: Element, target: HTMLElement): void {
  focusReturnTargets.set(popup, target);
}

/**
 * The last element that took the focus. When a menu item opens a dialog, React removes the menu and mounts the
 * dialog in the same render, so by the time the dialog looks for the element that had the focus it is gone and
 * the focus is on the body: this is where it was.
 */
let lastFocused: Element | null = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (event) => {
      lastFocused = event.target instanceof Element ? event.target : null;
    },
    true
  );
}

/** The element to give the focus back to: the one that has it, or the target of the popup that contains it. */
function resolveFocusReturnTarget(active: Element | null): HTMLElement | null {
  const focused = active && active !== document.body ? active : lastFocused;
  for (let element = focused; element; element = element.parentElement) {
    const target = focusReturnTargets.get(element);
    if (target) return target;
  }
  return focused instanceof HTMLElement ? focused : null;
}

interface UseFocusScopeOptions {
  /** Keeps Tab and Shift+Tab inside the container, as a modal dialog does. */
  trap?: boolean;
  /** Gives the focus back to the element that had it when the scope became active. Defaults to true. */
  restoreFocus?: boolean;
}

/**
 * Focus behaviour of a dialog, popup or menu, for keyboard and screen reader users: when it becomes active the
 * focus goes in (to its first reachable element, or to the container itself), optionally Tab stays inside, and
 * when it stops being active the focus goes back to the element that opened it. The focus is not taken back
 * when the user has already moved it somewhere else, for instance into another dialog.
 *
 * @param containerRef the dialog, popup or menu
 * @param active whether it is open and its content is rendered
 * @param options `trap` and `restoreFocus`
 * @returns `onKeyDown`, to put on the container so that Tab is trapped when `trap` is set
 */
export function useFocusScope(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  { trap = false, restoreFocus = true }: UseFocusScopeOptions = {}
): { onKeyDown: (event: ReactKeyboardEvent) => void } {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    openerRef.current = resolveFocusReturnTarget(document.activeElement);

    let frame = 0;
    if (container) {
      // An element cannot take the focus while it is hidden, and the content of a popup that fades in is still
      // hidden when it opens, so the focus is tried again on the next frames until it is visible
      const focusInside = (attempt: number) => {
        const [first] = getFocusableElements(container);
        if (first) {
          first.focus({ preventScroll: true });
          if (document.activeElement === first) return;
        }
        if (attempt < MAX_FOCUS_ATTEMPTS) {
          frame = window.requestAnimationFrame(() => focusInside(attempt + 1));
          return;
        }
        if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "-1");
        container.focus({ preventScroll: true });
      };
      focusInside(0);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      const opener = openerRef.current;
      openerRef.current = null;
      if (!restoreFocus || !opener?.isConnected) return;
      const current = document.activeElement;
      const focusIsLost = current === null || current === document.body || Boolean(container?.contains(current));
      if (focusIsLost) opener.focus({ preventScroll: true });
    };
  }, [active, containerRef, restoreFocus]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (!trap || event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "-1");
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [trap, containerRef]
  );

  return { onKeyDown };
}
