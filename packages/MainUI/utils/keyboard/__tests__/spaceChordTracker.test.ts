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

import {
  installSpaceChordTracker,
  isSpacePressed,
  uninstallSpaceChordTracker,
} from "@/utils/keyboard/spaceChordTracker";
import { createKeyEvent, pressKey } from "@/utils/keyboard/test-utils/keyboardEvents";

const SPACE = { key: " ", code: "Space" };

describe("spaceChordTracker", () => {
  beforeEach(() => installSpaceChordTracker());
  afterEach(() => uninstallSpaceChordTracker());

  it("tracks Space between keydown and keyup", () => {
    pressKey(SPACE);
    expect(isSpacePressed()).toBe(true);

    document.dispatchEvent(createKeyEvent(SPACE, "keyup"));
    expect(isSpacePressed()).toBe(false);
  });

  it("ignores other keys", () => {
    pressKey({ key: "a", code: "KeyA" });
    expect(isSpacePressed()).toBe(false);
  });

  it("prevents the blank only while Ctrl is down", () => {
    expect(pressKey({ ...SPACE, ctrl: true }).defaultPrevented).toBe(true);
    expect(pressKey(SPACE).defaultPrevented).toBe(false);
  });

  it("forgets Space when the window loses focus", () => {
    pressKey(SPACE);
    window.dispatchEvent(new Event("blur"));
    expect(isSpacePressed()).toBe(false);
  });

  it("installs its listeners only once", () => {
    installSpaceChordTracker();
    pressKey(SPACE);
    uninstallSpaceChordTracker();
    pressKey(SPACE);
    expect(isSpacePressed()).toBe(false);
  });

  it("ignores an uninstall when it is not installed", () => {
    uninstallSpaceChordTracker();
    expect(() => uninstallSpaceChordTracker()).not.toThrow();
  });
});
