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
      className="flex items-center bg-(--color-transparent-neutral-5) rounded-full overflow-hidden p-0 gap-1 mx-1 px-1"
      ref={containerRef}>
      <div className="px-1 flex">
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
        <IconButton onClick={handleScrollLeft} className="bg-transparent w-auto h-full rounded-full p-2 text-sm">
          <ChevronLeftIcon />
        </IconButton>
      )}
      <div
        className="w-full flex items-center overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar"
        ref={windowsContainerRef}>
        {windows.map((window, index) => {
          const title = window.title || getWindowTitle?.(window.windowId);
          const isActive = window.isActive;
          const canClose = windows.length > 1;
          return (
            <div
              key={window.windowId}
              className="flex items-center"
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
              {index < windows.length - 1 && <div className="h-5 w-0.5 bg-[#00030D1A] mx-1" />}
            </div>
          );
        })}
      </div>
      {showRightScrollButton && (
        <IconButton onClick={handleScrollRight} className="bg-transparent w-auto h-full rounded-full p-2 text-sm">
          <ChevronRightIcon />
        </IconButton>
      )}
      {showRightMenuButton && (
        <IconButton
          onClick={handleTabMenuOpen}
          className="bg-white w-auto h-full rounded-full p-2 text-sm"
          tooltip={t("primaryTabs.showTabs")}
          tooltipPosition="left">
          <ChevronsRightIcon />
        </IconButton>
      )}
      <MenuTabs anchorEl={anchorEl} onClose={handleTabMenuClose} onSelect={handleSelectWindow} />
    </div>
  );
}
