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

"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useWindowStore } from "@/stores/windowStore";
import { useTabsStore } from "@/stores/tabsStore";

const DEFAULT_BUTTON_ICON_SIZE = 50;
const DEFAULT_DEBOUNCE_DELAY = 200;

const checkIfAtStart = (scrollLeft: number) => scrollLeft <= 0;

const checkIfAtEnd = (scrollRight: number, clientWidth: number, scrollWidth: number) =>
  scrollRight + clientWidth >= scrollWidth - DEFAULT_BUTTON_ICON_SIZE;

// ---------------------------------------------------------------------------
// TabsProvider — manages scroll-state effects and activeWindow scroll-to.
// Refs and handlers live in the Zustand store; this component only drives
// the side effects that require DOM access.
// ---------------------------------------------------------------------------

export default function TabsProvider({ children }: { children: React.ReactNode }) {
  const windowsObj = useWindowStore((s) => s.windows);
  const activeWindow = useMemo(() => Object.values(windowsObj).find((w) => w.isActive) ?? null, [windowsObj]);

  // Refs are pre-created stable objects that never change in the store —
  // no subscription needed, getState() avoids the infinite loop that an
  // object-returning selector would cause (new object reference each render).
  const { containerRef, windowsContainerRef, tabRefs } = useTabsStore.getState();

  // ── Scroll button visibility helpers ──────────────────────────────────────

  const updateScrollButtons = useCallback((clientWidth: number, scrollWidth: number, scrollLeft: number) => {
    const hasHorizontalScroll = scrollWidth > clientWidth;
    if (!hasHorizontalScroll) {
      useTabsStore.getState().setScrollButtonsState(false, false, false);
      return;
    }

    const isAtStart = checkIfAtStart(scrollLeft);
    const isAtEnd = checkIfAtEnd(scrollLeft, clientWidth, scrollWidth);
    useTabsStore.getState().setScrollButtonsState(!isAtStart, !isAtEnd, !isAtStart || !isAtEnd);
  }, []);

  const updateScrollState = useCallback(() => {
    const container = windowsContainerRef.current;
    if (!container) return;
    const { clientWidth, scrollWidth, scrollLeft } = container;
    updateScrollButtons(clientWidth, scrollWidth, scrollLeft);
  }, [windowsContainerRef, updateScrollButtons]);

  // ── ResizeObserver — update buttons when the container resizes ────────────

  useEffect(() => {
    const container = containerRef.current;
    const windowsContainer = windowsContainerRef.current;
    if (!container || !windowsContainer) return;

    let lastWidth = container.clientWidth;
    let timeoutId: NodeJS.Timeout;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentWidth = container.clientWidth;
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth;
          updateScrollState();
        }
      }, DEFAULT_DEBOUNCE_DELAY);
    };

    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(windowsContainer);
    updateScrollState();

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [containerRef, windowsContainerRef, updateScrollState]);

  // ── Scroll event — update buttons on manual scroll ────────────────────────

  useEffect(() => {
    const container = windowsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { clientWidth, scrollWidth, scrollLeft } = container;
      updateScrollButtons(clientWidth, scrollWidth, scrollLeft);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [windowsContainerRef, updateScrollButtons]);

  // ── Scroll active tab into view ───────────────────────────────────────────

  useEffect(() => {
    if (!activeWindow) return;
    const tabElement = tabRefs.current[activeWindow.windowId];
    const container = windowsContainerRef.current;
    if (tabElement && container) {
      tabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeWindow, tabRefs, windowsContainerRef]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// useTabs — backward-compat hook.
// New code should import selectors from @/stores/tabsStore directly.
// ---------------------------------------------------------------------------

export const useTabs = () => useTabsStore();
