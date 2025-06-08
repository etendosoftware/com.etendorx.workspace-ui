"use client";

import { useCallback, useMemo } from "react";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import type { TabSwitchProps } from "@/components/window/types";

export const TabButton = ({ tab, onClick, active, onDoubleClick }: TabSwitchProps) => {
  const { window } = useMetadataContext();

  const title = useMemo(() => (tab.tabLevel === 0 ? window?.name : tab.name), [tab.tabLevel, tab.name, window?.name]);

  const handleClick = useCallback(() => {
    onClick(tab);
  }, [onClick, tab]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(tab);
  }, [onDoubleClick, tab]);

  return (
    <span>
     <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={title}
      aria-label={title}
      className={`
        px-2 py-1 w-auto border-b-2 font-semibold
        transition-colors appearance-none
        hover:text-(--color-neutral-90) hover:border-b-(--color-neutral-90)
        ${tab.tabLevel === 0 
          ? "text-xl mb-2" 
          : active 
            ? "border-b-(--color-neutral-90)" 
            : "border-b-transparent"
          }`
        }
        >
        {title}
      </button>
    </span>
  );
};

export default TabButton;
