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
// @data-testid-ignore
"use client";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useWindowListContext } from "@/contexts/window";
import Home from "@/screens/Home";
import Window from "@/components/window/Window";
import TabsProvider from "@/contexts/tabs";
import Loading from "@/components/loading";
import { useState, useEffect } from "react";

export default function Page() {
  const { windows, activeWindow, isHomeRoute, isRecoveryLoading } = useWindowListContext();

  /**
   * Tracks which windows have been mounted at least once.
   * Windows are lazily added on first activation and remain mounted (even when inactive)
   * so their React component tree — and therefore all component-local state — is preserved
   * across tab switches. Inactive windows are visually hidden with CSS but never unmounted.
   */
  const [mountedWindows, setMountedWindows] = useState<Set<string>>(new Set());

  // Mount a window the first time it becomes active
  useEffect(() => {
    if (activeWindow && !isHomeRoute) {
      setMountedWindows((prev) => {
        if (prev.has(activeWindow.windowIdentifier)) return prev;
        return new Set(prev).add(activeWindow.windowIdentifier);
      });
    }
  }, [activeWindow, isHomeRoute]);

  // Remove windows from the mounted set when they are closed
  useEffect(() => {
    setMountedWindows((prev) => {
      const openIds = new Set(windows.map((w) => w.windowIdentifier));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (openIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [windows]);

  const shouldShowTabs = windows.length > 0;

  if (isRecoveryLoading && !activeWindow) {
    return <Loading data-testid="Loading__Recovery" />;
  }

  return (
    <div className="flex flex-col gap-2 w-full h-full max-h-full p-1 pb-0">
      {shouldShowTabs && (
        <TabsProvider data-testid={`TabsProvider__${activeWindow?.windowIdentifier ?? "351d9c"}`}>
          <WindowTabs data-testid={`WindowTabs__${activeWindow?.windowIdentifier ?? "351d9c"}`} />
        </TabsProvider>
      )}
      {(!activeWindow || isHomeRoute) && (
        <Home data-testid={`Home__${activeWindow?.windowIdentifier ?? "351d9c"}`} />
      )}
      {windows
        .filter((w) => mountedWindows.has(w.windowIdentifier))
        .map((w) => {
          const isVisible = w.isActive && !isHomeRoute;
          return (
            <div
              key={w.windowIdentifier}
              /**
               * Use `contents` for the active window so it participates directly in the
               * outer flex layout (same as the original single-Window render).
               * Use `hidden` (display:none) for inactive windows to remove them from
               * layout entirely while keeping the React subtree alive in memory.
               */
              className={isVisible ? "contents" : "hidden"}
            >
              <Window window={w} data-testid={`Window__${w.windowIdentifier}`} />
            </div>
          );
        })}
    </div>
  );
}
