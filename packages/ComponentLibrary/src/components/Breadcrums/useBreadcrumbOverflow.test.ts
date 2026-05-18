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
import { useRef } from "react";
import { useBreadcrumbOverflow } from "./useBreadcrumbOverflow";
import type { BreadcrumbItem } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeItems = (count: number): BreadcrumbItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: `item-${i}`, label: `Label ${i}` }));

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

/**
 * Build a ResizeObserver mock.
 * `triggerOverflow` controls whether the observed element should appear to
 * overflow (scrollWidth > clientWidth) when the callback fires.
 */
function makeMockResizeObserver(triggerOverflow: boolean): {
  MockResizeObserver: jest.Mock;
  triggerObserver: () => void;
} {
  let capturedCallback: ResizeCallback | null = null;
  let capturedTarget: Element | null = null;

  const triggerObserver = () => {
    if (capturedCallback && capturedTarget) {
      if (triggerOverflow) {
        Object.defineProperty(capturedTarget, "scrollWidth", { value: 500, configurable: true });
        Object.defineProperty(capturedTarget, "clientWidth", { value: 200, configurable: true });
      } else {
        Object.defineProperty(capturedTarget, "scrollWidth", { value: 200, configurable: true });
        Object.defineProperty(capturedTarget, "clientWidth", { value: 500, configurable: true });
      }
      capturedCallback([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
    }
  };

  const MockResizeObserver = jest.fn().mockImplementation((callback: ResizeCallback) => ({
    observe: jest.fn((target: Element) => {
      capturedCallback = callback;
      capturedTarget = target;
    }),
    disconnect: jest.fn(),
  }));

  return { MockResizeObserver, triggerObserver };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useBreadcrumbOverflow", () => {
  const originalResizeObserver = global.ResizeObserver;

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
  });

  it("returns empty collapsedItems and all items visible when items.length <= 2", () => {
    const items = makeItems(2);
    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLElement | null>(null);
      return useBreadcrumbOverflow({ containerRef, items });
    });

    expect(result.current.collapsedItems).toHaveLength(0);
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.visibleItemsWithIndex).toHaveLength(2);
    // originalIndex must match position in the original array
    expect(result.current.visibleItemsWithIndex[0].originalIndex).toBe(0);
    expect(result.current.visibleItemsWithIndex[1].originalIndex).toBe(1);
  });

  it("returns all items as visible when there is no overflow (scrollWidth <= clientWidth)", () => {
    const items = makeItems(4);
    const { MockResizeObserver, triggerObserver } = makeMockResizeObserver(false);
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      // Attach a real div so the observer has a target
      if (!containerRef.current) {
        containerRef.current = document.createElement("div");
      }
      return useBreadcrumbOverflow({ containerRef, items });
    });

    act(() => {
      triggerObserver();
    });

    expect(result.current.collapsedItems).toHaveLength(0);
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.visibleItemsWithIndex).toHaveLength(4);
  });

  it("collapses all middle items when the container overflows", () => {
    const items = makeItems(5); // indices 0,1,2,3,4 — middles: 1,2,3
    const { MockResizeObserver, triggerObserver } = makeMockResizeObserver(true);
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    const { result } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      if (!containerRef.current) {
        containerRef.current = document.createElement("div");
      }
      return useBreadcrumbOverflow({ containerRef, items });
    });

    act(() => {
      triggerObserver();
    });

    // All 3 middle items (indices 1,2,3) must be collapsed
    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.collapsedItems).toHaveLength(3);
    expect(result.current.collapsedItems[0].id).toBe("item-1");
    expect(result.current.collapsedItems[1].id).toBe("item-2");
    expect(result.current.collapsedItems[2].id).toBe("item-3");

    // Only first and last remain visible
    expect(result.current.visibleItemsWithIndex).toHaveLength(2);
    expect(result.current.visibleItemsWithIndex[0].item.id).toBe("item-0");
    expect(result.current.visibleItemsWithIndex[0].originalIndex).toBe(0);
    expect(result.current.visibleItemsWithIndex[1].item.id).toBe("item-4");
    expect(result.current.visibleItemsWithIndex[1].originalIndex).toBe(4);
  });

  it("resets collapsedCount when items change", () => {
    const initialItems = makeItems(5);
    const { MockResizeObserver, triggerObserver } = makeMockResizeObserver(true);
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    let items = initialItems;
    const { result, rerender } = renderHook(() => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      if (!containerRef.current) {
        containerRef.current = document.createElement("div");
      }
      return useBreadcrumbOverflow({ containerRef, items });
    });

    // Trigger overflow so state becomes collapsed
    act(() => {
      triggerObserver();
    });

    expect(result.current.isCollapsed).toBe(true);

    // Now change items to a short list (2 items — never overflows)
    act(() => {
      items = makeItems(2);
      rerender();
    });

    // After items change the effect resets collapsedCount to 0
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.collapsedItems).toHaveLength(0);
    expect(result.current.visibleItemsWithIndex).toHaveLength(2);
  });
});
