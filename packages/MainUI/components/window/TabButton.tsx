/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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

    if (tab.tabLevel === 0) {
      return window?.name;
    }

    return tab.name;
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

  const getWindowButtonClass = () => {
    const baseWindowClass = `
      flex items-center gap-2 px-4 py-2 cursor-pointer min-w-[120px] max-w-[200px]
      transition-colors appearance-none w-full text-left
    `;

    if (active) {
      return `${baseWindowClass} bg-(--color-baseline-0) text-(--color-baseline-30)`;
    }

    return `${baseWindowClass} bg-gray-100 hover:bg-gray-50 text-gray-600`;
  };

  const getTabButtonClass = () => {
    const baseTabClass = `
      px-2 py-1 w-auto min-w-max flex-shrink-0 border-b-2 font-semibold
      transition-colors appearance-none whitespace-nowrap
      hover:text-(--color-neutral-90) hover:border-b-(--color-neutral-90)
    `;

    if (tab.tabLevel === 0) {
      return `${baseTabClass} text-xl mb-2`;
    }

    if (active) {
      return `${baseTabClass} border-b-(--color-neutral-90)`;
    }

    return `${baseTabClass} border-b-transparent`;
  };

  // Extract close button styling logic
  const getCloseButtonClass = () => {
    const baseCloseClass = `
      w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center
      hover:bg-gray-200 transition-colors
    `;

    if (active) {
      return `${baseCloseClass} opacity-70 hover:opacity-100`;
    }

    return `${baseCloseClass} opacity-50 hover:opacity-70`;
  };

  const baseClass = isWindow ? getWindowButtonClass() : getTabButtonClass();

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
          <button type="button" className={getCloseButtonClass()} onClick={handleClose} title="Cerrar ventana">
            ✕
          </button>
        )}
      </div>
    );
  }

  if (!title) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={title}
      aria-label={title}
      className={baseClass}>
      {title}
    </button>
  );
};

export default TabButton;
