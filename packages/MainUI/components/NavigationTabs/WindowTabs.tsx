"use client";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import WindowTab from "@/components/NavigationTabs/WindowTab";

export default function WindowTabs() {
  const { windows, setActiveWindow, closeWindow, isHomeRoute, navigateToHome } = useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();

  const handleGoHome = () => {
    navigateToHome();
  };

  const sortedWindows = windows;

  return (
    <div className={"flex items-center bg-(--color-transparent-neutral-5) rounded-full p-0 gap-1 mx-1"}>
      <div className="px-1 flex">
        <IconButton onClick={handleGoHome} className={isHomeRoute ? "bg-(--color-dynamic-main) text-white" : ""}>
          <HomeIcon />
        </IconButton>
      </div>
      <div className="flex">
        {sortedWindows.map((window) => {
          const title = window.title || getWindowTitle?.(window.windowId) || `Window ${window.windowId}`;
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
