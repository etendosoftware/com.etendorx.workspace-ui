'use client';

import { createContext, useCallback, useContext, useState } from 'react';

export const ModalContext = createContext<React.Dispatch<React.SetStateAction<React.ReactNode>>>(() => null);

export const useModalContext = () => useContext(ModalContext);

export const ModalContextProvider = ({ children }: React.PropsWithChildren) => {
  const [modal, setModalContent] = useState<React.ReactNode>(null);
  const [visible, setVisible] = useState(false);

  const setModal = useCallback((content: Parameters<typeof setModalContent>[0]) => {
    if (content == null) {
      setTimeout(() => {
        setModalContent(content);
      }, 200);
    } else {
      setModalContent(content);
    }

    setVisible(content != null);
  }, []);

  return (
    <ModalContext.Provider value={setModal}>
      {children}
      <div className="absolute inset-0 z-1000 pointer-events-none overflow-hidden">
        <div
          className={`w-full h-full transition delay-[50ms] duration-[150ms] ease-in-out ${visible ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-120'}`}>
          {modal}
        </div>
      </div>
    </ModalContext.Provider>
  );
};

export default ModalContextProvider;
