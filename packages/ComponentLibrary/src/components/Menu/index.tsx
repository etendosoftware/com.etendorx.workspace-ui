import {
  useClickOutside,
  useEscapeKey,
  useWindowResize,
} from "../../hooks/useEventListeners";
import { cleanDefaultClasses } from "../../utils/classUtil";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type DropdownMenuProps = {
  /** The element to which the menu will be anchored (positioned relative to) */
  anchorEl: HTMLElement | null;
  /** Callback fired when the menu requests to be closed */
  onClose: () => void;
  /** The content of the menu */
  children: React.ReactNode;
  /** Optional additional CSS classes to customize the menu style */
  className?: string;
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
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const menu = menuRef.current;
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY;

    if (x + menu.offsetWidth > window.innerWidth + window.scrollX) {
      x = Math.max(
        window.scrollX,
        rect.right - menu.offsetWidth + window.scrollX
      );
    }
    if (y + menu.offsetHeight > window.innerHeight + window.scrollY) {
      y = Math.max(
        window.scrollY,
        rect.top - menu.offsetHeight + window.scrollY
      );
    }
    setPosition({ x, y });
  }, [anchorEl]);

  useEffect(() => {
    if (!anchorEl) {
      setVisible(false);
      return;
    }
    calculatePosition();
    setVisible(true);
  }, [anchorEl, calculatePosition]);

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
        style={{ top: position.y, left: position.x }}
      >
        {children}
      </div>,
      document.body
    )
  );
};

Menu.displayName = "Menu";
export default Menu;
