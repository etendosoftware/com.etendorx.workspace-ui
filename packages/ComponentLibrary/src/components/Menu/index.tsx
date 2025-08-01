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

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside, useEscapeKey, useWindowResize } from "../../hooks/useEventListeners";
import { cleanDefaultClasses } from "../../utils/classUtil";

type DropdownMenuProps = {
  /**
   * The element to which the menu will be anchored (positioned relative to).
   * If `null`, the menu will not be displayed.
   */
  anchorEl: HTMLElement | null;
  /**
   * Callback fired when the menu requests to be closed.
   * Typically triggered by clicking outside or pressing the Escape key.
   */
  onClose: () => void;
  /**
   * The content of the menu to render inside the dropdown.
   */
  children: React.ReactNode;
  /**
   * Optional additional CSS classes to customize the menu style.
   * Merged with default classes via `cleanDefaultClasses`.
   */
  className?: string;
  /**
   * Horizontal offset (in pixels) applied to the menu's calculated X position.
   * Useful for fine-tuning alignment when the anchor element and menu don't visually align.
   * @default 0
   */
  offsetX?: number;
  /**
   * Vertical offset (in pixels) applied to the menu's calculated Y position.
   * Useful for creating spacing or shifting the menu up/down relative to the anchor.
   * @default 0
   */
  offsetY?: number;
  /**
   * Ref to expose a function allowing manual recalculation of the menu position.
   * Can be used when the content or layout changes dynamically.
   */
  menuRef?: React.MutableRefObject<{ recalculatePosition: () => void } | null>;
};

/**
 * A floating dropdown menu component that positions itself relative to an anchor element.
 * It uses a React portal to render the menu at the document body level.
 *
 * The menu automatically calculates and updates its position on mount and when the anchor changes.
 * It closes when clicking outside or when `onClose` is triggered.
 *
 * The `className` prop allows customizing the menu styles while preserving default classes with proper merging.
 */
const Menu: React.FC<DropdownMenuProps> = ({
  anchorEl,
  onClose,
  children,
  className = "",
  offsetX,
  offsetY,
  menuRef: externalMenuRef,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const adjustHorizontalPosition = (anchorRect: DOMRect, menuWidth: number, offsetX = 0) => {
    let x = anchorRect.left + offsetX;
    if (x + menuWidth > window.innerWidth) {
      x = anchorRect.right - menuWidth - offsetX;
      if (x < 0) x = 8;
    }
    return Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
  };

  const adjustVerticalPosition = (
    anchorRect: DOMRect,
    menuHeight: number,
    menuElement: HTMLDivElement,
    offsetY = 0
  ) => {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    let y = anchorRect.bottom + offsetY;

    const setMaxHeight = (maxHeight: number) => {
      menuElement.style.maxHeight = `${maxHeight}px`;
      menuElement.style.overflowY = "auto";
    };

    if (menuHeight > spaceBelow) {
      if (spaceAbove > spaceBelow && menuHeight <= spaceAbove) {
        y = anchorRect.top - menuHeight - offsetY;
      } else if (spaceBelow > spaceAbove) {
        y = anchorRect.bottom + offsetY;
        const maxHeight = spaceBelow - 16;
        if (menuHeight > maxHeight) setMaxHeight(maxHeight);
      } else {
        y = 8;
        const maxHeight = spaceAbove - 16;
        if (menuHeight > maxHeight) setMaxHeight(maxHeight);
      }
    }

    return Math.max(8, Math.min(y, window.innerHeight - Math.min(menuHeight, window.innerHeight - 16) - 8));
  };

  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const menuElement = menuRef.current;

    menuElement.style.maxHeight = "";
    menuElement.style.overflowY = "";

    const x = adjustHorizontalPosition(anchorRect, menuElement.offsetWidth, offsetX);
    const y = adjustVerticalPosition(anchorRect, menuElement.offsetHeight, menuElement, offsetY);

    setPosition({ x, y });
  }, [anchorEl, offsetX, offsetY]);

  useEffect(() => {
    if (!anchorEl) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      calculatePosition();
      setVisible(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [anchorEl, calculatePosition]);

  useEffect(() => {
    if (externalMenuRef) {
      externalMenuRef.current = {
        recalculatePosition: calculatePosition,
      };
    }
  }, [calculatePosition, externalMenuRef]);

  useEffect(() => {
    if (!menuRef.current || !visible) return;

    mutationObserverRef.current = new MutationObserver((mutations) => {
      let shouldRecalculate = false;

      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" || mutation.attributeName === "style")
        ) {
          shouldRecalculate = true;
        }

        if (mutation.type === "childList") {
          shouldRecalculate = true;
        }
      }

      if (shouldRecalculate) {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      }
    });

    mutationObserverRef.current.observe(menuRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [visible, calculatePosition]);

  const handleClose = () => {
    setVisible(false);
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useClickOutside(menuRef, handleClose);
  useEscapeKey(handleClose);
  useWindowResize(calculatePosition);

  const DEFAULT_MENU_CLASSES = `${visible ? "opacity-100" : "opacity-0"} fixed z-[999] bg-white shadow-lg shadow-(--color-transparent-neutral-30) transition-opacity duration-200 rounded-xl`;

  return (
    anchorEl &&
    createPortal(
      <div
        role="menu"
        ref={menuRef}
        className={`${cleanDefaultClasses(DEFAULT_MENU_CLASSES, className)}`}
        style={{
          top: position.y,
          left: position.x,
          visibility: visible ? "visible" : "hidden",
        }}>
        {children}
      </div>,
      document.body
    )
  );
};

Menu.displayName = "Menu";
export default Menu;
