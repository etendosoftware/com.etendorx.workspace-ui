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

  return null;
}
