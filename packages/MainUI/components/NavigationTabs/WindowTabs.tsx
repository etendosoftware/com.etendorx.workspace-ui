"use client";
import { useCallback, useState } from "react";
import { useMetadataContext } from "@/hooks/useMetadataContext";
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

export default function WindowTabs() {
  const { windows, isHomeRoute, setActiveWindow, closeWindow, navigateToHome } = useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();
  const { t } = useTranslation();

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

  const handleTabMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleTabMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelectWindow = useCallback(
    (windowId: string) => {
      setActiveWindow(windowId);
    },
    [setActiveWindow]
  );

  const handleGoHome = () => {
    navigateToHome();
  };

  return (
    <div
      className="flex items-center bg-(--color-transparent-neutral-5) rounded-full overflow-hidden p-0 px-0.5 h-9 min-h-9"
      ref={containerRef}>
      <div className="flex items-center h-8">
        <IconButton
          onClick={handleGoHome}
          className={`w-8 h-8 text-[1.5rem] bg-(--color-baseline-0) hover:bg-(--color-etendo-main) hover:text-(--color-etendo-contrast-text) ${isHomeRoute ? "bg-(--color-etendo-main) text-(--color-etendo-contrast-text)" : ""}`}
          title={t("primaryTabs.dashboard")}
          tooltipPosition="bottom"
          aria-label={t("primaryTabs.dashboard")}>
          <HomeIcon className="h-[1.125rem] w-[1.125rem]" />
        </IconButton>
      </div>
      {showLeftScrollButton && (
        <IconButton
          onClick={handleScrollLeft}
          className="max-h-7 bg-transparent w-auto h-full rounded-full p-2 text-sm hover:bg-[var(--color-transparent-neutral-5)] hover:text-(--color-baseline-80)">
          <ChevronLeftIcon className="h-[1rem] w-[1rem]" />
        </IconButton>
      )}
      <div
        className="w-full flex items-center px-2 overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar h-9"
        ref={windowsContainerRef}>
        {windows.map((window, index) => {
          const title = window.title || getWindowTitle?.(window.windowId);
          const isActive = window.isActive;
          const canClose = windows.length > 1;

          const activeIndex = windows.findIndex((w) => w.isActive);
          const showSeparator = index !== activeIndex - 1 && index !== activeIndex;

          return (
            <div
              key={window.windowId}
              className="flex items-center h-9"
              ref={(el) => {
                tabRefs.current[window.windowId] = el;
              }}>
              <WindowTab
                windowId={window.windowId}
                title={title}
                isActive={isActive}
                onActivate={() => {
                  handleSelectWindow(window.windowId);
                }}
                onClose={() => {
                  closeWindow(window.windowId);
                }}
                canClose={canClose}
              />
              {showSeparator && index < windows.length - 1 && (
                <div className="h-4 w-0.5 bg-(--color-baseline-100) opacity-10 mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
      {showRightScrollButton && (
        <IconButton
          onClick={handleScrollRight}
          className="max-h-7 bg-transparent w-auto h-full rounded-full p-2 text-sm hover:bg-[var(--color-transparent-neutral-5)] hover:text-(--color-baseline-80)">
          <ChevronRightIcon className="h-[1rem] w-[1rem]" />
        </IconButton>
      )}
      {showRightMenuButton && (
        <IconButton
          onClick={handleTabMenuOpen}
          containerClassName="h-8 w-8 flex justify-center items-center"
          className="h-8 w-8 bg-white rounded-full p-1.5 text-sm"
          tooltip={t("primaryTabs.showTabs")}
          tooltipPosition="left">
          <ChevronsRightIcon className="h-[1.125rem] w-[1.125rem]" />
        </IconButton>
      )}
      <MenuTabs anchorEl={anchorEl} onClose={handleTabMenuClose} onSelect={handleSelectWindow} />
    </div>
  );
}
