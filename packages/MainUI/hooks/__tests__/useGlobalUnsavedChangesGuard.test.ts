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
import { useGlobalUnsavedChangesGuard } from "../useGlobalUnsavedChangesGuard";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

const WINDOW_IDENTIFIER = "143_1000";
const FORM_SOURCE_KEY = buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, "header");

describe("useGlobalUnsavedChangesGuard", () => {
  const action = jest.fn();

  const setDirtyWindows = (dirtyWindows: Record<string, Record<string, boolean>>) => {
    act(() => {
      useWindowStore.setState({ dirtyWindows });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({ dirtyWindows: {} });
    useUnsavedChangesStore.setState({ request: null, bypassUnloadWarning: false });
  });

  it("runs the action immediately when nothing is dirty", () => {
    const { result } = renderHook(() => useGlobalUnsavedChangesGuard());

    act(() => {
      result.current.guard(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });

  it("defers the action behind the modal when a window is dirty", () => {
    const { result } = renderHook(() => useGlobalUnsavedChangesGuard());
    setDirtyWindows({ [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } });

    act(() => {
      result.current.guard(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(useUnsavedChangesStore.getState().request?.onProceed).toBe(action);
  });

  it("runs the deferred action when the stored request proceeds", () => {
    const { result } = renderHook(() => useGlobalUnsavedChangesGuard());
    setDirtyWindows({ [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } });

    act(() => {
      result.current.guard(action);
    });
    act(() => {
      useUnsavedChangesStore.getState().request?.onProceed();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("stops deferring once the dirty flags are cleared", () => {
    const { result } = renderHook(() => useGlobalUnsavedChangesGuard());
    setDirtyWindows({ [WINDOW_IDENTIFIER]: { [FORM_SOURCE_KEY]: true } });
    setDirtyWindows({ [WINDOW_IDENTIFIER]: {} });

    act(() => {
      result.current.guard(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(useUnsavedChangesStore.getState().request).toBeNull();
  });
});
