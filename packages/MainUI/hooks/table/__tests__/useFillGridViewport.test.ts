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

import { renderHook } from "@testing-library/react";
import { useFillGridViewport } from "../useFillGridViewport";

const CLIENT_HEIGHT = 400;
const PAGE_HEIGHT = 300;

type Props = Parameters<typeof useFillGridViewport>[0];

/** Container whose content height can be changed from the test. */
const makeContainer = (scrollHeight: number, clientHeight = CLIENT_HEIGHT) => {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  Object.defineProperty(element, "scrollHeight", { configurable: true, writable: true, value: scrollHeight });
  return element;
};

let resizeCallback: (() => void) | undefined;
const disconnect = jest.fn();

beforeAll(() => {
  global.ResizeObserver = jest.fn((callback: () => void) => {
    resizeCallback = callback;
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect };
  }) as unknown as typeof ResizeObserver;
});

describe("useFillGridViewport", () => {
  const fetchMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resizeCallback = undefined;
  });

  /** Renders the hook over a container with the given content height. */
  const renderFill = (scrollHeight: number, overrides: Partial<Props> = {}) => {
    const containerRef = { current: makeContainer(scrollHeight) };
    const initialProps: Props = {
      containerRef,
      recordCount: 20,
      loading: false,
      hasMoreRecords: true,
      fetchMore,
      ...overrides,
    };
    const view = renderHook((props: Props) => useFillGridViewport(props), { initialProps });
    return { ...view, containerRef, initialProps };
  };

  it("requests the next page when the rows leave no scroll bar", () => {
    renderFill(PAGE_HEIGHT);
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it.each<[string, number, Partial<Props>]>([
    ["the grid already scrolls", 1000, {}],
    ["there are no more records", PAGE_HEIGHT, { hasMoreRecords: false }],
    ["a page is loading", PAGE_HEIGHT, { loading: true }],
    ["the last load failed", PAGE_HEIGHT, { error: new Error("down") }],
  ])("does not request a page when %s", (_case, scrollHeight, overrides) => {
    renderFill(scrollHeight, overrides);
    expect(fetchMore).not.toHaveBeenCalled();
  });

  it("does not request a page for a hidden grid", () => {
    const containerRef = { current: makeContainer(0, 0) };
    renderHook(() =>
      useFillGridViewport({ containerRef, recordCount: 20, loading: false, hasMoreRecords: true, fetchMore })
    );
    expect(fetchMore).not.toHaveBeenCalled();
  });

  it("keeps one request in flight and asks again only after the page has loaded", () => {
    const { rerender, initialProps, containerRef } = renderFill(PAGE_HEIGHT);
    expect(fetchMore).toHaveBeenCalledTimes(1);

    // Render right after fetchMore, before the load starts: no second request.
    rerender({ ...initialProps });
    expect(fetchMore).toHaveBeenCalledTimes(1);

    rerender({ ...initialProps, loading: true });
    // The page arrived, but the 40 rows still do not fill the grid.
    rerender({ ...initialProps, loading: false, recordCount: 40 });
    expect(fetchMore).toHaveBeenCalledTimes(2);

    // The next page fills it: no more requests.
    rerender({ ...initialProps, loading: true, recordCount: 40 });
    Object.defineProperty(containerRef.current, "scrollHeight", { value: 1000 });
    rerender({ ...initialProps, loading: false, recordCount: 60 });
    expect(fetchMore).toHaveBeenCalledTimes(2);
  });

  it("requests a page when the grid grows taller than its rows", () => {
    const { containerRef } = renderFill(1000);
    expect(fetchMore).not.toHaveBeenCalled();

    Object.defineProperty(containerRef.current, "clientHeight", { value: 1200 });
    resizeCallback?.();
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it("stops observing the grid on unmount", () => {
    const { unmount } = renderFill(1000);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
