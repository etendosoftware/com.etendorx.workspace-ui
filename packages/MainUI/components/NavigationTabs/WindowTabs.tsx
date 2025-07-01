"use client";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import WindowTab from "@/components/NavigationTabs/WindowTab";
import { useEffect, useRef, useState } from "react";

export default function WindowTabs() {
  const { windows, setActiveWindow, closeWindow, isHomeRoute, navigateToHome } = useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();
  const windowContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = windowContainerRef.current;
    if (container) {
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      
      if (hasHorizontalScroll) {
      container.scrollTo({
        left: container.scrollWidth,
        behavior: 'smooth'
      });
    }
  }
  }, [windows]);

  const handleGoHome = () => {
    navigateToHome();
  };

  return (
    <div className={"flex items-center bg-(--color-transparent-neutral-5) rounded-full p-0 gap-1 mx-1"}>
      <div className="px-1 flex">
        <IconButton onClick={handleGoHome} className={isHomeRoute ? "bg-(--color-dynamic-main) text-white" : ""}>
          <HomeIcon />
        </IconButton>
      </div>
      <div
        ref={windowContainerRef}
        className={`w-full flex overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar`}
        >
        {windows.map((window) => {
          const title = window.title || getWindowTitle?.(window.windowId);
          const isActive = window.isActive;
          const canClose = windows.length > 1;
          return (
            <WindowTab
              key={window.windowId}
              windowId={window.windowId}
              title={title}
              isActive={isActive}
              order={window.order}
              onActivate={() => {
                setActiveWindow(window.windowId);
              }}
              onClose={() => {
                closeWindow(window.windowId);
              }}
              canClose={canClose}
            />
          );
        })}
      </div>
    </div>
  );
}
