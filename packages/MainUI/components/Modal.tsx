import { useEffect, useState } from 'react';
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
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);

      return () => {
        setTimeout(() => setVisible(false), 300);
      };
    }
  }, [open]);

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
  }, [onClose, open]);

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      <div
        className={`w-full h-full transition-all transform-gpu duration-200 ${open ? 'opacity-100 pointer-events-auto scale-y-100 scale-x-100 ease-out' : 'opacity-0 pointer-events-none scale-x-200 scale-y-150 ease-in'}`}>
        {visible ? children : null}
      </div>
    </div>,
    document.body,
  );
}
