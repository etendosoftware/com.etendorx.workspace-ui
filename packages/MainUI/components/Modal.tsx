import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children, open }: { children: React.ReactNode; open: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key == 'Escape') {
        console.debug('Escape pressed');
      }
    };

    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [children, open]);

  return createPortal(
    <div className="absolute inset-0 z-1000 pointer-events-none overflow-hidden">
      <div
        className={`w-full h-full transition delay-[50ms] duration-[150ms] ease-in-out ${open ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-120'}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
