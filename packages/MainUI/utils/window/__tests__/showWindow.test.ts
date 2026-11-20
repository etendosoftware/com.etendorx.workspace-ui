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

import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { findWindowToReplace, runReplacingWindow, showWindow } from "../showWindow";

const WINDOW_ID = "143";
const OPEN_WINDOW = "143_1";
const NEW_WINDOW = "143_2";
const WINDOW_DATA = { title: "Sales Order", initialized: true };

describe("showWindow", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({});
    useWindowStore.getState().cleanState();
    useUnsavedChangesStore.setState({ request: null });
  });

  it("opens a window that is not open yet", () => {
    showWindow({ windowId: WINDOW_ID, windowIdentifier: NEW_WINDOW, windowData: WINDOW_DATA });

    expect(Object.keys(useWindowStore.getState().windows)).toEqual([NEW_WINDOW]);
  });

  it("replaces the open instance of the window, as classic", () => {
    useWindowStore.getState().setWindowActive({ windowIdentifier: OPEN_WINDOW, windowData: WINDOW_DATA });

    showWindow({ windowId: WINDOW_ID, windowIdentifier: NEW_WINDOW, windowData: WINDOW_DATA });

    expect(Object.keys(useWindowStore.getState().windows)).toEqual([NEW_WINDOW]);
  });

  it("opens another instance when AllowMultiTab is Y for the window", () => {
    savePreferences({ [`AllowMultiTab_${WINDOW_ID}`]: "Y" });
    useWindowStore.getState().setWindowActive({ windowIdentifier: OPEN_WINDOW, windowData: WINDOW_DATA });

    showWindow({ windowId: WINDOW_ID, windowIdentifier: NEW_WINDOW, windowData: WINDOW_DATA });

    expect(Object.keys(useWindowStore.getState().windows)).toEqual([OPEN_WINDOW, NEW_WINDOW]);
  });

  it("asks about the unsaved changes of the instance it replaces before replacing it", () => {
    useWindowStore.getState().setWindowActive({ windowIdentifier: OPEN_WINDOW, windowData: WINDOW_DATA });
    useWindowStore.getState().setWindowDirtySource(OPEN_WINDOW, "form:186", true);

    showWindow({ windowId: WINDOW_ID, windowIdentifier: NEW_WINDOW, windowData: WINDOW_DATA });

    expect(Object.keys(useWindowStore.getState().windows)).toEqual([OPEN_WINDOW]);
    const request = useUnsavedChangesStore.getState().request;
    expect(request).not.toBeNull();
    request?.onProceed();
    expect(Object.keys(useWindowStore.getState().windows)).toEqual([NEW_WINDOW]);
  });
});

describe("findWindowToReplace and runReplacingWindow", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({});
    useWindowStore.getState().cleanState();
  });

  it("finds the open instance unless the window allows several", () => {
    expect(findWindowToReplace(WINDOW_ID)).toBeUndefined();
    useWindowStore.getState().setWindowActive({ windowIdentifier: OPEN_WINDOW, windowData: WINDOW_DATA });
    expect(findWindowToReplace(WINDOW_ID)).toBe(OPEN_WINDOW);
    savePreferences({ AllowMultiTab: "Y" });
    expect(findWindowToReplace(WINDOW_ID)).toBeUndefined();
  });

  it("runs at once when nothing is replaced", () => {
    const action = jest.fn();
    runReplacingWindow(undefined, action);
    expect(action).toHaveBeenCalled();
  });
});
