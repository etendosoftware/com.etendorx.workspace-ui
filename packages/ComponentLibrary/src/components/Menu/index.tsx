import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cleanDefaultClasses } from '../../utils/classUtil';

export interface IMenuProps {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children?: React.ReactElement | React.ReactElement[];
  className?: string;
}

const Menu = ({ open, onClose, anchorEl, className = '', children }: IMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const menu = menuRef.current;
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY;

    if (x + menu.offsetWidth > window.innerWidth + window.scrollX) {
      x = Math.max(window.scrollX, rect.right - menu.offsetWidth + window.scrollX);
    }
    if (y + menu.offsetHeight > window.innerHeight + window.scrollY) {
      y = Math.max(window.scrollY, rect.top - menu.offsetHeight + window.scrollY);
    }
    setPosition({ x, y });
  }, [anchorEl]);

  useEffect(() => {
    if (open) {
      setShow(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (show && open) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [show, open]);

  useLayoutEffect(() => {
    if (show) {
      calculatePosition();
    }
  }, [show, calculatePosition]);

  const onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName === 'opacity' && !isVisible) {
      setShow(false);
    }
  };

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        if (!menuRef.current.contains(document.activeElement)) {
          onClose();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, show, calculatePosition]);

  if (!show) return null;

  const DEFAULT_MENU_CLASSES = `fixed z-[999] bg-white shadow-xl shadow-black/40 transition-opacity duration-100 ${
    isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`;

  return (
    <div
      ref={menuRef}
      className={cleanDefaultClasses(className, DEFAULT_MENU_CLASSES)}
      style={{ top: position.y, left: position.x }}
      onTransitionEnd={onTransitionEnd}>
      {children}
    </div>
  );
};

export default Menu;
