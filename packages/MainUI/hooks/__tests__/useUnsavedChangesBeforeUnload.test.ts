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

import { renderHook, act } from "@testing-library/react";
import { useUnsavedChangesBeforeUnload } from "../useUnsavedChangesBeforeUnload";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const BEFORE_UNLOAD = "beforeunload";
const WINDOW_IDENTIFIER = "143_1000";
const FORM_SOURCE_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, "header");
const DIRTY_STATE = { [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } };

describe("useUnsavedChangesBeforeUnload", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  /** Handlers registered for the beforeunload event by this hook. */
  const registeredHandlers = () => addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === BEFORE_UNLOAD);

  const removedHandlers = () => removeEventListenerSpy.mock.calls.filter(([eventName]) => eventName === BEFORE_UNLOAD);

  const setDirtyWindows = (dirtyWindows: Record<string, Record<string, boolean>>) => {
    act(() => {
      useWindowStore.setState({ dirtyWindows });
    });
  };

  beforeEach(() => {
    useWindowStore.setState({ dirtyWindows: {} });
    useUnsavedChangesStore.setState({ request: null, bypassUnloadWarning: false });
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("does not register the listener while nothing is dirty", () => {
    renderHook(() => useUnsavedChangesBeforeUnload());

    expect(registeredHandlers()).toHaveLength(0);
  });

  it("registers the listener once a window becomes dirty", () => {
    renderHook(() => useUnsavedChangesBeforeUnload());

    setDirtyWindows(DIRTY_STATE);

    expect(registeredHandlers()).toHaveLength(1);
  });

  it("removes the listener when everything is saved or discarded", () => {
    renderHook(() => useUnsavedChangesBeforeUnload());
    setDirtyWindows(DIRTY_STATE);

    setDirtyWindows({ [WINDOW_IDENTIFIER]: {} });

    expect(removedHandlers()).toHaveLength(1);
  });

  it("does not register the listener while the bypass is on", () => {
    useUnsavedChangesStore.setState({ bypassUnloadWarning: true });

    renderHook(() => useUnsavedChangesBeforeUnload());
    setDirtyWindows(DIRTY_STATE);

    expect(registeredHandlers()).toHaveLength(0);
  });

  it("removes the listener on unmount", () => {
    useWindowStore.setState({ dirtyWindows: DIRTY_STATE });
    const { unmount } = renderHook(() => useUnsavedChangesBeforeUnload());

    unmount();

    expect(removedHandlers()).toHaveLength(1);
  });

  it("cancels the unload event so the browser shows its warning", () => {
    useWindowStore.setState({ dirtyWindows: DIRTY_STATE });
    renderHook(() => useUnsavedChangesBeforeUnload());

    const [, handler] = registeredHandlers()[0];
    const event = { preventDefault: jest.fn(), returnValue: undefined } as unknown as BeforeUnloadEvent;
    (handler as (e: BeforeUnloadEvent) => void)(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe("");
  });
});
