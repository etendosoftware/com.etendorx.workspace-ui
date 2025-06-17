"use client";

import { useCallback, useState } from "react";
import type { NavigationTab } from "@/contexts/navigationTabs";
import X from "@workspaceui/componentlibrary/src/assets/icons/x.svg";

interface NavigationTabItemProps {
  tab: NavigationTab;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
  isDragging?: boolean;
}

export function NavigationTabItem({ tab, onSelect, onClose, isDragging }: NavigationTabItemProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onSelect(tab.id);
    },
    [tab.id, onSelect]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClose(tab.id);
    },
    [tab.id, onClose]
  );

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 && tab.canClose) {
        e.preventDefault();
        onClose(tab.id);
      }
    },
    [tab.id, tab.canClose, onClose]
  );

  const handleAuxClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 && tab.canClose) {
        e.preventDefault();
        onClose(tab.id);
      }
    },
    [tab.id, tab.canClose, onClose]
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={`
        flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] 
        border-r border-gray-200 cursor-pointer select-none
        transition-all duration-200 relative group
        ${tab.isActive ? "bg-white border-b-2 border-b-blue-500 shadow-sm" : "bg-gray-50 hover:bg-gray-100"}
        ${isDragging ? "opacity-50" : ""}
      `}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      onAuxClick={handleAuxClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={tab.title}
      role="tab"
      aria-selected={tab.isActive}
      tabIndex={tab.isActive ? 0 : -1}
    >
      {/* Icono */}
      {tab.icon && (
        <span className="text-sm flex-shrink-0" aria-hidden="true">
          {typeof tab.icon === "string" ? tab.icon : tab.icon}
        </span>
      )}
      <span className="truncate text-sm font-medium text-gray-700 flex-1">{tab.title}</span>

      {tab.title === "Loading..." && (
        <div
          className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"
          aria-label="Cargando"
        />
      )}
      {tab.canClose && (isHovering || tab.isActive) && (
        <button
          type="button"
          onClick={handleClose}
          className="w-4 h-4 rounded-full hover:bg-gray-200 flex items-center justify-content center flex-shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Cerrar tab"
          aria-label={`Cerrar ${tab.title}`}
          tabIndex={-1}>
          <X size={12} className="text-gray-500" />
        </button>
      )}
      {tab.isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" aria-hidden="true" />}
    </div>
  );
}

export default NavigationTabItem;
