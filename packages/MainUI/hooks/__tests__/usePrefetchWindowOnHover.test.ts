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

import { act, renderHook } from "@testing-library/react";
import { buildExternalPageWindowId } from "@/utils/menu/externalMenuEntry";
import { usePrefetchWindowOnHover } from "../usePrefetchWindowOnHover";

const mockPrefetchWindowData = jest.fn();

jest.mock("@/stores/metadataStore", () => ({
  useMetadataZustandStore: (selector: (state: { prefetchWindowData: jest.Mock }) => unknown) =>
    selector({ prefetchWindowData: mockPrefetchWindowData }),
}));

const HOVER_DELAY_MS = 150;

describe("usePrefetchWindowOnHover", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPrefetchWindowData.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("prefetches the window once the pointer has rested on the item", () => {
    const { result } = renderHook(() => usePrefetchWindowOnHover());

    act(() => result.current("143"));
    expect(mockPrefetchWindowData).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS);
    });
    expect(mockPrefetchWindowData).toHaveBeenCalledTimes(1);
    expect(mockPrefetchWindowData).toHaveBeenCalledWith("143");
  });

  it("only prefetches the last item when the pointer moves across several quickly", () => {
    const { result } = renderHook(() => usePrefetchWindowOnHover());

    act(() => result.current("143"));
    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS - 50);
    });
    act(() => result.current("167"));
    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS);
    });

    expect(mockPrefetchWindowData).toHaveBeenCalledTimes(1);
    expect(mockPrefetchWindowData).toHaveBeenCalledWith("167");
  });

  it.each([undefined, null, ""])("ignores items without a window id (%p)", (windowId) => {
    const { result } = renderHook(() => usePrefetchWindowOnHover());

    act(() => result.current(windowId));
    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS);
    });

    expect(mockPrefetchWindowData).not.toHaveBeenCalled();
  });

  it("ignores the in-app tabs that embed an external page", () => {
    const { result } = renderHook(() => usePrefetchWindowOnHover());

    act(() => result.current(buildExternalPageWindowId("menu-1")));
    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS);
    });

    expect(mockPrefetchWindowData).not.toHaveBeenCalled();
  });

  it("drops a pending prefetch when the component unmounts", () => {
    const { result, unmount } = renderHook(() => usePrefetchWindowOnHover());

    act(() => result.current("143"));
    unmount();
    act(() => {
      jest.advanceTimersByTime(HOVER_DELAY_MS);
    });

    expect(mockPrefetchWindowData).not.toHaveBeenCalled();
  });
});
