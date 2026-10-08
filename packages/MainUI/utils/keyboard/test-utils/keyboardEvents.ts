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

/** Shared helpers for the keyboard shortcut tests. */

export interface KeyPress {
  key: string;
  code?: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export const createKeyEvent = ({ key, code, ctrl, meta, alt, shift }: KeyPress, type = "keydown") =>
  new KeyboardEvent(type, {
    key,
    code,
    ctrlKey: Boolean(ctrl),
    metaKey: Boolean(meta),
    altKey: Boolean(alt),
    shiftKey: Boolean(shift),
    bubbles: true,
    cancelable: true,
  });

/** Dispatches a keydown on `target` (the document by default) and returns the event. */
export const pressKey = (press: KeyPress, target: EventTarget = document) => {
  const event = createKeyEvent(press);
  target.dispatchEvent(event);
  return event;
};

/** Holds Space down (with Ctrl, as a user starting the chord would), runs `action` and releases it. */
export const withSpaceHeld = (action: () => void) => {
  document.dispatchEvent(createKeyEvent({ key: " ", code: "Space", ctrl: true }));
  try {
    action();
  } finally {
    document.dispatchEvent(createKeyEvent({ key: " ", code: "Space" }, "keyup"));
  }
};

/** Appends an element of `tagName` to the body; the caller removes it. */
export const appendElement = (tagName: string, parent: Element = document.body) => {
  const element = document.createElement(tagName);
  parent.appendChild(element);
  return element;
};
