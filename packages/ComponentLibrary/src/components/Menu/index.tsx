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

  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const menuElement = menuRef.current;

    menuElement.style.maxHeight = "";
    menuElement.style.overflowY = "";

    const menuWidth = menuElement.offsetWidth;
    const menuHeight = menuElement.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = anchorRect.left + (offsetX ?? 0);
    let y = anchorRect.bottom + (offsetY ?? 0);

    if (x + menuWidth > viewportWidth) {
      x = anchorRect.right - menuWidth - (offsetX ?? 0);

      if (x < 0) {
        x = 8;
      }
    }

    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    if (menuHeight > spaceBelow) {
      if (spaceAbove > spaceBelow && menuHeight <= spaceAbove) {
        y = anchorRect.top - menuHeight - (offsetY ?? 0);
      } else {
        if (spaceBelow > spaceAbove) {
          y = anchorRect.bottom + (offsetY ?? 0);
          const maxHeight = spaceBelow - 16;
          if (menuHeight > maxHeight) {
            menuElement.style.maxHeight = `${maxHeight}px`;
            menuElement.style.overflowY = "auto";
          }
        } else {
          const maxHeight = spaceAbove - 16;
          y = 8;
          if (menuHeight > maxHeight) {
            menuElement.style.maxHeight = `${maxHeight}px`;
            menuElement.style.overflowY = "auto";
          }
        }
      }
    }

    x = Math.max(8, Math.min(x, viewportWidth - menuWidth - 8));
    y = Math.max(8, Math.min(y, viewportHeight - Math.min(menuHeight, viewportHeight - 16) - 8));

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
