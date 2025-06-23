"use client";

import { useCallback, useMemo } from "react";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import type { TabSwitchProps } from "@/components/window/types";

export const TabButton = ({
  tab,
  onClick,
  active,
  onDoubleClick,
  isWindow = false,
  showIcon = false,
  onClose,
  canClose = true,
}: TabSwitchProps) => {
  const { window } = useMetadataContext();

  const title = useMemo(() => {
    if (isWindow) {
      return tab.title || tab.name;
    }
    return tab.tabLevel === 0 ? window?.name : tab.name;
  }, [tab.tabLevel, tab.name, tab.title, window?.name, isWindow]);

  const handleClick = useCallback(() => {
    onClick(tab);
  }, [onClick, tab]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(tab);
  }, [onDoubleClick, tab]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.(e);
    },
    [onClose]
  );

  const baseClass = isWindow
    ? `
        flex items-center gap-2 px-4 py-2 cursor-pointer min-w-[120px] max-w-[200px]
        transition-colors appearance-none w-full text-left
        ${active ? "bg-(--color-baseline-0) text-(--color-baseline-30)" : "bg-gray-100 hover:bg-gray-50 text-gray-600"}
      `
    : `
        px-2 py-1 w-auto border-b-2 font-semibold
        transition-colors appearance-none
        hover:text-(--color-neutral-90) hover:border-b-(--color-neutral-90)
        ${tab.tabLevel === 0 ? "text-xl mb-2" : active ? "border-b-(--color-neutral-90)" : "border-b-transparent"}
      `;

  if (isWindow) {
    return (
      <div className="flex items-center w-full gap-2">
        <button
          type="button"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          title={title}
          aria-label={title}
          className={baseClass}>
          {showIcon && <div className="w-4 h-4 flex-shrink-0">🏠</div>}
          <span className="flex-1 truncate text-sm" title={title}>
            {title}
          </span>
        </button>
        {canClose && onClose && (
          <button
            type="button"
            className={`
              w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center
              hover:bg-gray-200 transition-colors
              ${active ? "opacity-70 hover:opacity-100" : "opacity-50 hover:opacity-70"}
            `}
            onClick={handleClose}
            title="Cerrar ventana">
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={title}
        aria-label={title}
        className={baseClass}>
        {title}
      </button>
    </span>
  );
};

export default TabButton;
