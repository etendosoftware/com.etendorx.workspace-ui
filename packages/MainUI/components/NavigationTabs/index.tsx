"use client";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import HomeIcon from "@workspaceui/componentlibrary/src/assets/icons/home.svg";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";

interface WindowTabProps {
  windowId: string;
  title: string;
  isActive: boolean;
  order: number;
  onActivate: () => void;
  onClose: () => void;
  canClose?: boolean;
  icon?: React.ReactNode;
}

function WindowTab({ title, isActive, order, onActivate, onClose, canClose = true }: WindowTabProps) {
  return (
    <button
      type="button"
      className={`
        flex gap-2 px-2 py-2 cursor-pointer mx-1
        min-w-[140px] max-w-[220px] relative group
        transition-all duration-200
        ${
          isActive
            ? "bg-white text-(--color-baseline-90) border-b-2 border-(--color-dynamic-main)"
            : " text-gray-700 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-300"
        }
      `}
      style={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      }}
      onClick={onActivate}
      title={`${title} (Window ${order})`}>
      <span className="flex-1 truncate text-sm font-medium" title={title}>
        {title}
      </span>
      {canClose && (
        <button
          type="button"
          className={`
            w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center transition-opacity duration-200
            hover:bg-gray-300 hover:text-gray-800
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Cerrar ventana">
          <CloseIcon />
        </button>
      )}
    </button>
  );
}

export function WindowTabs() {
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

export default WindowTabs;
