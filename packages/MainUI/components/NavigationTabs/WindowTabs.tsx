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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import ChevronRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import ChevronLeftIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg";
import ChevronsRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevrons-right.svg";
import WindowTab from "@/components/NavigationTabs/WindowTab";
import MenuTabs from "@/components/NavigationTabs/MenuTabs";
import { useTabs } from "@/contexts/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowContext } from "@/contexts/window";

export default function WindowTabs() {
  const { windows, isHomeRoute, setActiveWindow, closeWindow, navigateToHome } = useMultiWindowURL();
  const { t } = useTranslation();
  const { cleanupWindow, setWindowActive } = useWindowContext();

  const {
    containerRef,
    windowsContainerRef,
    tabRefs,
    showLeftScrollButton,
    showRightScrollButton,
    showRightMenuButton,
    handleScrollLeft,
    handleScrollRight,
  } = useTabs();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [closingWindowIds, setClosingWindowIds] = useState<Set<string>>(new Set());

  const handleTabMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleTabMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelectWindow = useCallback(
    (windowIdentifier: string) => {
      setActiveWindow(windowIdentifier);
      // TODO: delete this code when multi-window is fully stable
      setWindowActive(windowIdentifier);
    },
    [setActiveWindow, setWindowActive]
  );

  const handleGoHome = () => {
    navigateToHome();
  };

  // Clear any optimistic closing ids that no longer exist in windows
  useEffect(() => {
    setClosingWindowIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (windows.some((w) => w.window_identifier === id)) next.add(id);
      }
      return next;
    });
  }, [windows]);

  const visibleWindows = useMemo(
    () => windows.filter((w) => !closingWindowIds.has(w.window_identifier)),
    [windows, closingWindowIds]
  );

  return (
    <div
      className="flex items-center bg-(--color-transparent-neutral-5) rounded-full overflow-hidden p-0 px-0.5 h-9 min-h-9"
      ref={containerRef}>
      <div className="flex items-center h-8">
        <IconButton
          onClick={handleGoHome}
          className={`w-8 h-8 text-[1.5rem] bg-(--color-baseline-0) hover:bg-(--color-etendo-main) hover:text-(--color-etendo-contrast-text) ${isHomeRoute ? "bg-(--color-etendo-main) text-(--color-etendo-contrast-text)" : ""}`}
          tooltip={t("primaryTabs.dashboard")}
          aria-label={t("primaryTabs.dashboard")}
          data-testid="IconButton__c8117d">
          <HomeIcon className="h-[1.125rem] w-[1.125rem]" data-testid="HomeIcon__c8117d" />
        </IconButton>
      </div>
      {showLeftScrollButton && (
        <IconButton
          onClick={handleScrollLeft}
          className="max-h-7 bg-transparent w-auto h-full rounded-full p-2 text-sm hover:bg-[var(--color-transparent-neutral-5)] hover:text-(--color-baseline-80)"
          data-testid="IconButton__c8117d">
          <ChevronLeftIcon className="h-[1rem] w-[1rem]" data-testid="ChevronLeftIcon__c8117d" />
        </IconButton>
      )}
      <div
        className="w-full flex items-center px-2 overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar h-9"
        ref={windowsContainerRef}>
        {visibleWindows.map((window, index) => {
          // TODO: improve loading display
          // TODO: if the window.title dosen't finish loading, get the title from metadata
          const title = window.title || "Loading...";
          const isActive = window.isActive;
          const canClose = visibleWindows.length > 1;

          const activeIndex = visibleWindows.findIndex((w) => w.isActive);
          const showSeparator = index !== activeIndex - 1 && index !== activeIndex;

          return (
            <div
              key={window.window_identifier}
              className="flex items-center h-9"
              ref={(el) => {
                tabRefs.current[window.window_identifier] = el;
              }}>
              <WindowTab
                title={title}
                isActive={isActive}
                onActivate={() => {
                  handleSelectWindow(window.window_identifier);
                }}
                onClose={() => {
                  // Optimistic removal for instant feedback
                  setClosingWindowIds((prev) => new Set(prev).add(window.window_identifier));
                  // Clean up table state for this window
                  cleanupWindow(window.windowId);
                  closeWindow(window.window_identifier);
                }}
                canClose={canClose}
                data-testid="WindowTab__c8117d"
              />
              {showSeparator && index < visibleWindows.length - 1 && (
                <div className="h-4 w-0.5 bg-(--color-baseline-100) opacity-10 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
      {showRightScrollButton && (
        <IconButton
          onClick={handleScrollRight}
          className="max-h-7 bg-transparent w-auto h-full rounded-full p-2 text-sm hover:bg-[var(--color-transparent-neutral-5)] hover:text-(--color-baseline-80)"
          data-testid="IconButton__c8117d">
          <ChevronRightIcon className="h-[1rem] w-[1rem]" data-testid="ChevronRightIcon__c8117d" />
        </IconButton>
      )}
      {showRightMenuButton && (
        <IconButton
          onClick={handleTabMenuOpen}
          containerClassName="h-8 w-8 flex justify-center items-center"
          className="h-8 w-8 bg-white rounded-full p-1.5 text-sm"
          tooltip={t("primaryTabs.showTabs")}
          tooltipPosition="left"
          data-testid="IconButton__c8117d">
          <ChevronsRightIcon className="h-[1.125rem] w-[1.125rem]" data-testid="ChevronsRightIcon__c8117d" />
        </IconButton>
      )}
      <MenuTabs
        anchorEl={anchorEl}
        onClose={handleTabMenuClose}
        onSelect={handleSelectWindow}
        data-testid="MenuTabs__c8117d"
      />
    </div>
  );
}
