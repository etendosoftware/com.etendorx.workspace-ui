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

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside, useEscapeKey, useWindowResize } from "../../hooks/useEventListeners";
import { getFocusableElements, setFocusReturnTarget, useFocusScope } from "../../hooks/useFocusScope";
import { cleanDefaultClasses } from "../../utils/classUtil";
import { computeMenuVerticalPlacement } from "./placement";

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
  /**
   * Optional styles to override or add to the menu container.
   */
  style?: React.CSSProperties;
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
  style,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const { y, maxHeight } = computeMenuVerticalPlacement({
      anchorTop: anchorRect.top,
      anchorBottom: anchorRect.bottom,
      menuHeight,
      viewportHeight: window.innerHeight,
      offsetY,
    });

    if (maxHeight !== null) {
      menuElement.style.maxHeight = `${maxHeight}px`;
      menuElement.style.overflowY = "auto";
    }

    return y;
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

  // The focus goes into the menu when it opens and back to the button that opened it when it closes (ETP-6304)
  useFocusScope(menuRef, visible);
  useEffect(() => {
    if (anchorEl && menuRef.current) setFocusReturnTarget(menuRef.current, anchorEl);
  }, [anchorEl, visible]);

  const NAVIGATION_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      // Tab leaves the menu: it closes and the focus goes back to its button
      event.preventDefault();
      handleClose();
      return;
    }
    const target = event.target as HTMLElement;
    const isTextField = target.matches("input:not([type='checkbox']):not([type='radio']), textarea, select");
    if (!NAVIGATION_KEYS.has(event.key) || isTextField || !menuRef.current) return;

    const items = getFocusableElements(menuRef.current);
    if (items.length === 0) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index <= 0 ? items.length : index) - 1;
    else if (event.key === "End") next = items.length - 1;
    items[next].focus();
  };

  useClickOutside(menuRef as React.RefObject<HTMLElement>, handleClose);
  useEscapeKey(handleClose);
  useWindowResize(calculatePosition);

  const DEFAULT_MENU_CLASSES = `${visible ? "opacity-100" : "opacity-0"} fixed z-[999] bg-white shadow-lg shadow-(--color-transparent-neutral-30) transition-opacity duration-200 rounded-xl`;

  return (
    anchorEl &&
    createPortal(
      <div
        role="menu"
        ref={menuRef}
        onKeyDown={handleKeyDown}
        className={`${cleanDefaultClasses(DEFAULT_MENU_CLASSES, className)}`}
        style={{
          top: position.y,
          left: position.x,
          visibility: visible ? "visible" : "hidden",
          ...style,
        }}>
        {children}
      </div>,
      document.body
    )
  );
};

Menu.displayName = "Menu";
export default Menu;
