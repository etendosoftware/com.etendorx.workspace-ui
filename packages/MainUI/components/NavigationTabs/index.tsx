"use client";

import X from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

interface WindowTabProps {
  windowId: string;
  title: string;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  canClose?: boolean;
}

function WindowTab({ windowId, title, isActive, onActivate, onClose, canClose = true }: WindowTabProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer
        min-w-[120px] max-w-[200px] relative group
        ${isActive ? "bg-white border-b-white" : "bg-gray-100 hover:bg-gray-50 border-b-gray-200"}
      `}
      onClick={onActivate}
      style={{
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
      }}>
      <div className="w-4 h-4 flex-shrink-0">🏠</div>
      <span
        className={`
          flex-1 truncate text-sm
          ${isActive ? "text-gray-900" : "text-gray-600"}
        `}
        title={title}>
        {title}
      </span>
      {canClose && (
        <button
          type="button"
          className={`
            w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center
            hover:bg-gray-200 transition-colors
            ${isActive ? "opacity-70 hover:opacity-100" : "opacity-50 hover:opacity-70"}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Cerrar ventana">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

interface WindowTabsProps {
  className?: string;
}

export function WindowTabs({ className = "" }: WindowTabsProps) {
  const { windows, setActiveWindow, closeWindow } = useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();

  if (windows.length === 0) {
    return null;
  }

  return (
    <div className={`flex bg-gray-200 border-b border-gray-300 max-w-1/2${className}`}>
      {windows.map((window) => {
        const title = window.title || getWindowTitle?.(window.windowId) || `Window ${window.windowId}`;

        return (
          <WindowTab
            key={window.windowId}
            windowId={window.windowId}
            title={title}
            isActive={window.isActive}
            onActivate={() => setActiveWindow(window.windowId)}
            onClose={() => closeWindow(window.windowId)}
            canClose={windows.length > 1} // No permitir cerrar si es la última
          />
        );
      })}

      {/* Espacio para futuras funcionalidades (nuevo tab, etc.) */}
      <div className="flex-1 bg-gray-200" />
    </div>
  );
}

export default WindowTabs;
