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
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useWindowStore } from "@/stores/windowStore";
import Home from "@/screens/Home";
import Window from "@/components/window/Window";
import ExternalPage from "@/components/window/ExternalPage";
import TabsProvider from "@/contexts/tabs";
import Loading from "@/components/loading";
import { AccessDeniedScreen } from "@/components/AccessDeniedDisplay";
import type { WindowState } from "@/utils/window/constants";

/** In-app tabs of External menu entries embed their URL; every other tab is an AD window. */
const renderWindowContent = (win: WindowState) => {
  if (win.externalUrl) {
    return <ExternalPage window={win} data-testid={`ExternalPage__${win.windowIdentifier}`} />;
  }
  return <Window window={win} data-testid={`Window__${win.windowIdentifier}`} />;
};

interface WindowSlotProps {
  windowIdentifier: string;
  isVisible: boolean;
}

/**
 * Layer for one open window. It subscribes to its own slice of the store, so a change in one
 * window (filters, selection, form state) never re-renders the layers of the other windows.
 */
const WindowSlot = memo(function WindowSlot({ windowIdentifier, isVisible }: WindowSlotProps) {
  const win = useWindowStore((s) => s.windows[windowIdentifier]);
  if (!win) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-2"
      style={{
        visibility: isVisible ? "visible" : "hidden",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 150ms ease-in-out",
        pointerEvents: isVisible ? "auto" : "none",
      }}>
      {renderWindowContent(win)}
    </div>
  );
});

export default function Page() {
  // Only the identifiers and the active one are read here: the page must not re-render when the
  // state inside a window changes.
  const windowIdentifiers = useWindowStore(useShallow((s) => Object.keys(s.windows)));
  const activeWindowIdentifier = useWindowStore(
    (s) => Object.values(s.windows).find((w) => w.isActive)?.windowIdentifier ?? null
  );
  const isRecoveryLoading = useWindowStore((s) => s.isRecoveryLoading);
  const accessDeniedWindowCount = useWindowStore((s) => s.accessDeniedWindowCount);
  const setAccessDeniedWindowCount = useWindowStore((s) => s.setAccessDeniedWindowCount);
  const isHomeRoute = !activeWindowIdentifier;

  // Track which windows have been visited at least once.
  // A window is only mounted after its first visit; subsequent switches just toggle CSS visibility.
  const [mountedWindows, setMountedWindows] = useState<Set<string>>(new Set());
  const prevActiveRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const id = activeWindowIdentifier ?? undefined;
    if (id && id !== prevActiveRef.current) {
      prevActiveRef.current = id;
      setMountedWindows((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }
  }, [activeWindowIdentifier]);

  const shouldShowTabs = windowIdentifiers.length > 0;
  const shouldShowWindow = !!activeWindowIdentifier && !isHomeRoute;
  // Only when nothing else survived: with other windows open the discards are reported via toast.
  const shouldShowAccessDenied = accessDeniedWindowCount > 0 && windowIdentifiers.length === 0;

  const handleGoHome = useCallback(() => setAccessDeniedWindowCount(0), [setAccessDeniedWindowCount]);

  if (isRecoveryLoading && !activeWindowIdentifier) {
    return <Loading data-testid="Loading__Recovery" />;
  }

  if (shouldShowAccessDenied) {
    return <AccessDeniedScreen onGoHome={handleGoHome} />;
  }

  return (
    <div className="flex flex-col gap-0 w-full h-full max-h-full">
      {shouldShowTabs && (
        <TabsProvider data-testid={`TabsProvider__${activeWindowIdentifier ?? "351d9c"}`}>
          <WindowTabs data-testid={`WindowTabs__${activeWindowIdentifier ?? "351d9c"}`} />
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
            opacity: shouldShowWindow ? 0 : 1,
            transition: "opacity 150ms ease-in-out",
            pointerEvents: shouldShowWindow ? "none" : "auto",
          }}>
          <Home data-testid={`Home__${activeWindowIdentifier ?? "351d9c"}`} />
        </div>
        {windowIdentifiers.map((windowIdentifier) => {
          const isActive = windowIdentifier === activeWindowIdentifier;
          if (!mountedWindows.has(windowIdentifier) && !isActive) return null;
          return (
            <WindowSlot
              key={windowIdentifier}
              windowIdentifier={windowIdentifier}
              isVisible={isActive && !isHomeRoute}
            />
          );
        })}
      </div>
    </div>
  );
}
