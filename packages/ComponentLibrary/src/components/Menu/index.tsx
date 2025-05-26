import React, { useRef, useEffect, useState } from 'react';

export interface IMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  anchorRef: React.RefObject<HTMLElement> | null;
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
  animation?: 'fade' | 'height';
}

const Menu: React.FC<IMenuProps> = ({ anchorRef, open, children, onClose, animation = 'fade', className, ...rest }) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [visible, setVisible] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (!open || !anchorRef?.current) return;

    const updatePosition = () => {
      const buttonRect = anchorRef.current!.getBoundingClientRect();

      requestAnimationFrame(() => {
        const dropdownEl = dropdownRef.current;
        if (dropdownEl) {
          const dropdownRect = dropdownEl.getBoundingClientRect();
          const dropdownRight = buttonRect.left + dropdownRect.width;
          const fitsOnRight = dropdownRight <= window.innerWidth;

          const left = fitsOnRight
            ? buttonRect.left + window.scrollX
            : buttonRect.right - dropdownRect.width + window.scrollX;

          setPosition({
            top: buttonRect.bottom + window.scrollY + 2,
            left: Math.max(left, 0),
          });

          setVisible(true);
          setContentHeight(dropdownEl.scrollHeight);
        }
      });
    };

    setVisible(false);
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open || !anchorRef?.current) return;

    const handleClickOutside = (event: MouseEvent) => {
      const dropdownEl = dropdownRef.current;
      const buttonEl = anchorRef.current;

      const target = event.target as Node;

      if (dropdownEl && !dropdownEl.contains(target) && buttonEl && !buttonEl.contains(target)) {
        if (!dropdownEl.contains(document.activeElement)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  const style: React.CSSProperties = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    transition: '',
  };

  if (animation === 'height') {
    style.maxHeight = open ? `${contentHeight}px` : '0px';
    style.overflow = open ? 'visible' : 'hidden';
    style.opacity = visible ? 1 : 0;
    style.transition = 'opacity 0.1s ease, max-height 0.3s ease';
  } else if (animation === 'fade') {
    style.opacity = open && visible ? 1 : 0;
    style.transition = 'opacity 0.2s ease';
    style.pointerEvents = open && visible ? 'auto' : 'none';
  }

  return (
    <div
      ref={dropdownRef}
      className={`fixed z-999 bg-white shadow-xl shadow-black/40 ${className ?? ''}`}
      style={style}
      {...rest}>
      {children}
    </div>
  );
};

export default Menu;
