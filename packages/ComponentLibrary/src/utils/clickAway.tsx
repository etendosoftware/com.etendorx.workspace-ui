import type React from 'react';
import { useEffect, useRef } from 'react';

export const CustomClickAwayListener: React.FC<{
  onClickAway: () => void;
  children: React.ReactNode;
}> = ({ onClickAway, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickAway();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickAway]);

  return <div ref={ref}>{children}</div>;
};

export default CustomClickAwayListener;
