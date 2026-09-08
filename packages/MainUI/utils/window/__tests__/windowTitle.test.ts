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

import type { WindowState } from "@/utils/window/constants";
import { UNTITLED_WINDOW_TITLE, getTitleForWindow } from "../windowTitle";

const WINDOW_ID = "143";
const WINDOW_IDENTIFIER = `${WINDOW_ID}_1000`;
const METADATA_NAME = "Sales Order";

const createWindow = (title: string): WindowState =>
  ({
    windowId: WINDOW_ID,
    windowIdentifier: WINDOW_IDENTIFIER,
    title,
    isActive: true,
    initialized: true,
    navigation: { activeLevels: [0], activeTabsByLevel: new Map(), initialized: true },
    tabs: {},
  }) as unknown as WindowState;

describe("getTitleForWindow", () => {
  it("prefers the title stored on the window", () => {
    expect(getTitleForWindow(createWindow("Purchase Order"), { [WINDOW_ID]: { name: METADATA_NAME } })).toBe(
      "Purchase Order"
    );
  });

  it("falls back to the metadata name for a window recovered from the URL", () => {
    expect(getTitleForWindow(createWindow(""), { [WINDOW_ID]: { name: METADATA_NAME } })).toBe(METADATA_NAME);
  });

  it("falls back to the untitled label when the metadata has not loaded yet", () => {
    expect(getTitleForWindow(createWindow(""), {})).toBe(UNTITLED_WINDOW_TITLE);
  });

  it("falls back to the untitled label when the metadata has no name", () => {
    expect(getTitleForWindow(createWindow(""), { [WINDOW_ID]: {} })).toBe(UNTITLED_WINDOW_TITLE);
  });
});
