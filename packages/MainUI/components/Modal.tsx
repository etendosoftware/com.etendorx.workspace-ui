import { useEffect } from 'react';
import { useModalContext } from '@/contexts/modal';

export default function Modal({ children, open }: { children: React.ReactNode; open: boolean }) {
  const setModal = useModalContext();

  useEffect(() => {
    if (open) {
      setModal(children);
    } else {
      setModal(null);
    }
  }, [children, open, setModal]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key == 'Escape') {
        setModal(null);
      }
    };

    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [children, open, setModal]);

  return null;
}
