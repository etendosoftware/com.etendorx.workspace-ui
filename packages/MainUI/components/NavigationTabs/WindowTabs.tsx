"use client";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import ChevronRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import ChevronLeftIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg";
import WindowTab from "@/components/NavigationTabs/WindowTab";
import { useCallback, useEffect, useRef, useState } from "react";

export default function WindowTabs() {
  const { windows, setActiveWindow, closeWindow, isHomeRoute, navigateToHome } =
    useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();
  const windowContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const container = windowContainerRef.current;
    if (container) {
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;

      if (hasHorizontalScroll) {
        setShowScrollButton(true);
        container.scrollTo({
          left: container.scrollWidth,
          behavior: "smooth",
        });
      } else {
        setShowScrollButton(false);
      }
    }
  }, [windows]);

  const handleScroll = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.stopPropagation();
      const container = windowContainerRef.current;
      if (container) {
        const isAtStart = container.scrollLeft === 0;
        const isAtEnd =
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 1;

        if (side === "left" && isAtStart) {
          console.log("Already at the leftmost position");
          return;
        }

        if (side === "right" && isAtEnd) {
          console.log("Already at the rightmost position");
          return;
        }

        container.scrollBy({
          left: side === "left" ? -200 : 200,
          behavior: "smooth",
        });
      }
    },
    []
  );

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
      {showScrollButton && (
        <IconButton
          onClick={(e) => handleScroll(e, "left")}
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
      {showScrollButton && (
        <IconButton
          onClick={(e) => handleScroll(e, "right")}
          className="bg-transparent w-auto h-full rounded-full p-2 text-sm"
        >
          <ChevronRightIcon />
        </IconButton>
      )}
    </div>
  );
}
