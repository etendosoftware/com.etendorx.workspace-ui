"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import ChevronRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import ChevronLeftIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg";
import ChevronsRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevrons-right.svg";
import WindowTab from "@/components/NavigationTabs/WindowTab";
import MenuTabs from "@/components/NavigationTabs/MenuTabs";

const DEFAULT_SCROLL_AMOUNT = 200;

export default function WindowTabs() {
  const { windows, setActiveWindow, closeWindow, isHomeRoute, navigateToHome } =
    useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();
  const windowContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScrollButton, setShowLeftScrollButton] = useState(false);
  const [showRightScrollButton, setShowRightScrollButton] = useState(false);
  const [showRightMenuButton, setShowRightMenuButton] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = windowContainerRef.current;
    if (container) {
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;

      if (hasHorizontalScroll) {
        setShowLeftScrollButton(true);
        setShowRightScrollButton(true);
        setShowRightMenuButton(true);
        container.scrollTo({
          left: container.scrollWidth,
          behavior: "smooth",
        });
      } else {
        setShowLeftScrollButton(false);
        setShowRightScrollButton(false);
        setShowRightMenuButton(false);
      }
    }
  }, [windows]);

  const handleScrollLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = windowContainerRef.current;
    if (container) {
      container.scrollBy({
        left: -DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollLeft = container.scrollLeft - DEFAULT_SCROLL_AMOUNT;
      const isAtStart = newScrollLeft <= 0;
      if (isAtStart) {
        setShowLeftScrollButton(false);
      }
      setShowRightScrollButton(true);
    }
  }, []);

  const handleScrollRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = windowContainerRef.current;
    if (container) {
      container.scrollBy({
        left: DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollRight = container.scrollLeft + DEFAULT_SCROLL_AMOUNT;
      const isAtEnd =
        newScrollRight + container.clientWidth >= container.scrollWidth - 1;
      if (isAtEnd) {
        setShowRightScrollButton(false);
      }
      setShowLeftScrollButton(true);
    }
  }, []);

  const handleTabMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const handleTabMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleGoHome = () => {
    navigateToHome();
  };

  return (
    <div className="flex items-center bg-(--color-transparent-neutral-5) rounded-full oveflow-hidden p-0 gap-1 mx-1 px-1">
      <div className="px-1 flex">
        <IconButton
          onClick={handleGoHome}
          className={isHomeRoute ? "bg-(--color-dynamic-main) text-white" : ""}
        >
          <HomeIcon />
        </IconButton>
      </div>
      {showLeftScrollButton && (
        <IconButton
          onClick={handleScrollLeft}
          className="bg-transparent w-auto h-full rounded-full p-2 text-sm"
        >
          <ChevronLeftIcon />
        </IconButton>
      )}
      <div
        ref={windowContainerRef}
        className="w-full flex items-center overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar"
      >
        {windows.map((window, index) => {
          const title = window.title || getWindowTitle?.(window.windowId);
          const isActive = window.isActive;
          const canClose = windows.length > 1;
          return (
            <div key={window.windowId} className="flex items-center">
              <WindowTab
                windowId={window.windowId}
                title={title}
                isActive={isActive}
                onActivate={() => {
                  setActiveWindow(window.windowId);
                }}
                onClose={() => {
                  closeWindow(window.windowId);
                }}
                canClose={canClose}
              />
              {index < windows.length - 1 && !isActive && (
                <div className="h-5 w-0.5 bg-[#00030D1A] mx-1" />
              )}
            </div>
          );
        })}
      </div>
      {showRightScrollButton && (
        <IconButton
          onClick={handleScrollRight}
          className="bg-transparent w-auto h-full rounded-full p-2 text-sm"
        >
          <ChevronRightIcon />
        </IconButton>
      )}
      {showRightMenuButton && (
        <IconButton
          onClick={handleTabMenuOpen}
          className="bg-white w-auto h-full rounded-full p-2 text-sm"
        >
          <ChevronsRightIcon />
        </IconButton>
      )}
      <MenuTabs anchorEl={anchorEl} onClose={handleTabMenuClose} />
    </div>
  );
}
