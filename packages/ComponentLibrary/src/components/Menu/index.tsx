import { useEffect, useRef, useMemo } from 'react';

const MenuDropdown = ({
  open,
  onClose,
  rect,
  children,
}: {
  open: boolean;
  onClose: () => void;
  rect: DOMRect | null;
  children: React.ReactNode;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const position = useMemo(() => {
    if (!rect) return { x: 0, y: 0 };
    return {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
    };
  }, [rect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className='fixed z-999 bg-white shadow-xl shadow-black/40 rounded w-48 py-2'
      style={{ top: position.y, left: position.x }}>
      {children}
    </div>
  );
};

export default MenuDropdown;
