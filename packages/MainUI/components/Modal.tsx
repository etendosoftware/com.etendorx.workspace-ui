import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => unknown;
}) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key == 'Escape') {
          onClose?.();
        }
      };

      document.addEventListener('keydown', handler);

      return () => {
        document.removeEventListener('keydown', handler);
      };
    }
  }, [children, open, onClose]);

  return createPortal(
    <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden">
      <div
        className={`w-full h-full transition delay-[50ms] duration-[150ms] ease-in-out ${open ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-150'}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
