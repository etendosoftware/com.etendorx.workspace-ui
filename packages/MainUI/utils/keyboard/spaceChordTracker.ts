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

/**
 * Tracks whether Space is held down, which is what turns Ctrl+Arrow into the classic
 * Ctrl+Space+Arrow chord (`ob-keyboard-manager.js`, `isSpacePressed`).
 */

const SPACE_CODE = "Space";
const SPACE_KEY = " ";

let spacePressed = false;
let installed = false;

const isSpaceEvent = (event: KeyboardEvent) => event.code === SPACE_CODE || event.key === SPACE_KEY;

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isSpaceEvent(event)) return;
  spacePressed = true;
  // While Ctrl is down the Space only starts a chord: it must not type a blank or press a button.
  if (event.ctrlKey || event.metaKey) event.preventDefault();
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (isSpaceEvent(event)) spacePressed = false;
};

/** Losing the window focus while Space is down never delivers its keyup. */
const handleBlur = () => {
  spacePressed = false;
};

/** Installs the document listeners once; later calls are no-ops. */
export function installSpaceChordTracker(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("blur", handleBlur);
}

/** Removes the listeners and forgets the state. Meant for tests. */
export function uninstallSpaceChordTracker(): void {
  if (!installed) return;
  installed = false;
  spacePressed = false;
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("keyup", handleKeyUp, true);
  window.removeEventListener("blur", handleBlur);
}

export function isSpacePressed(): boolean {
  return spacePressed;
}
