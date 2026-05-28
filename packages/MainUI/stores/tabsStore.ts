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

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const DEFAULT_SCROLL_AMOUNT = 200;

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export interface TabsStore {
  /**
   * Ref for the outer container element (wraps the entire tab bar).
   * Stable object — React attaches/detaches the DOM node via .current.
   */
  containerRef: React.RefObject<HTMLDivElement>;

  /**
   * Ref for the scrollable windows container (the div that holds the tabs).
   * Stable object — mutated by React DOM, not by Zustand.
   */
  windowsContainerRef: React.RefObject<HTMLDivElement>;

  /**
   * Map of windowIdentifier → tab DOM element.
   * Populated by WindowTabs when each tab mounts/unmounts.
   */
  tabRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;

  // ── Scroll button visibility ─────────────────────────────────────────────
  showLeftScrollButton: boolean;
  showRightScrollButton: boolean;
  showRightMenuButton: boolean;

  /** Batch-update all three scroll-button visibility flags in one set() call. */
  setScrollButtonsState: (left: boolean, right: boolean, menu: boolean) => void;

  // ── Scroll handlers ───────────────────────────────────────────────────────
  handleScrollLeft: (e: React.MouseEvent) => void;
  handleScrollRight: (e: React.MouseEvent) => void;
}

// ---------------------------------------------------------------------------
// Store
// Refs are pre-created as plain objects: { current: null }.
// React accepts any { current: null } as a ref and will mutate .current when
// the element mounts/unmounts.  Since Zustand never observes these mutations,
// there are no spurious re-renders — exactly the same behaviour as useRef().
// ---------------------------------------------------------------------------

export const useTabsStore = create<TabsStore>()(
  devtools(
    (set, get) => ({
      // Refs — stable object references, never replaced
      containerRef: { current: null } as unknown as React.RefObject<HTMLDivElement>,
      windowsContainerRef: { current: null } as unknown as React.RefObject<HTMLDivElement>,
      tabRefs: { current: {} } as React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>,

      // Scroll button state
      showLeftScrollButton: false,
      showRightScrollButton: false,
      showRightMenuButton: false,

      setScrollButtonsState: (left, right, menu) =>
        set(
          { showLeftScrollButton: left, showRightScrollButton: right, showRightMenuButton: menu },
          false,
          "setScrollButtonsState"
        ),

      handleScrollLeft: (e) => {
        e.stopPropagation();
        get().windowsContainerRef.current?.scrollBy({
          left: -DEFAULT_SCROLL_AMOUNT,
          behavior: "smooth",
        });
      },

      handleScrollRight: (e) => {
        e.stopPropagation();
        get().windowsContainerRef.current?.scrollBy({
          left: DEFAULT_SCROLL_AMOUNT,
          behavior: "smooth",
        });
      },
    }),
    { name: "TabsStore" }
  )
);
