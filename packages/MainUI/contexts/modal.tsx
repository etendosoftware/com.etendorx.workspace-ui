'use client';

import { createContext, useContext, useState } from 'react';

export const ModalContext = createContext<React.Dispatch<React.SetStateAction<React.ReactNode>>>(() => null);

export const useModalContext = () => useContext(ModalContext);

export const ModalContextProvider = ({ children }: React.PropsWithChildren) => {
  const [modal, setModal] = useState<React.ReactNode>(null);

  return (
    <ModalContext.Provider value={setModal}>
      {children}
      {modal}
    </ModalContext.Provider>
  );
};

export default ModalContextProvider;
