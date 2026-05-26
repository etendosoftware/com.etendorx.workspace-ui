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
import { useMemo } from "react";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useWindowStore } from "@/stores/windowStore";
import Home from "@/screens/Home";
import Window from "@/components/window/Window";
import TabsProvider from "@/contexts/tabs";
import Loading from "@/components/loading";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const windowsObj = useWindowStore((s) => s.windows);
  const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);
  const windows = useMemo(() => Object.values(windowsObj), [windowsObj]);
  const activeWindow = useMemo(() => windows.find((w) => w.isActive) ?? null, [windows]);
  const isHomeRoute = !activeWindow;

  // Track which windows have been visited at least once.
  // A window is only mounted after its first visit; subsequent switches just toggle CSS visibility.
  const [mountedWindows, setMountedWindows] = useState<Set<string>>(new Set());
  const prevActiveRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const id = activeWindow?.windowIdentifier;
    if (id && id !== prevActiveRef.current) {
      prevActiveRef.current = id;
      setMountedWindows((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  }, [activeWindow?.windowIdentifier]);

  const shouldShowTabs = windows.length > 0;
  const shouldShowWindow = activeWindow && !isHomeRoute;

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
      {/* All windows share the same absolute-positioned layer.
          Only visibility/pointerEvents toggle on switch — no positioning change,
          no ResizeObserver trigger, virtualizer never remeasures. */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={{
            visibility: shouldShowWindow ? "hidden" : "visible",
            pointerEvents: shouldShowWindow ? "none" : "auto",
          }}>
          <Home data-testid={`Home__${activeWindow?.windowIdentifier ?? "351d9c"}`} />
        </div>
        {windows.map((win) => {
          const isActive = win.windowIdentifier === activeWindow?.windowIdentifier;
          if (!mountedWindows.has(win.windowIdentifier) && !isActive) return null;
          return (
            <div
              key={win.windowIdentifier}
              className="absolute inset-0 flex flex-col overflow-hidden"
              style={{
                visibility: isActive && !isHomeRoute ? "visible" : "hidden",
                pointerEvents: isActive && !isHomeRoute ? "auto" : "none",
              }}>
              <Window window={win} data-testid={`Window__${win.windowIdentifier}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
