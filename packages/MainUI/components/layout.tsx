'use client';

import { useUserContext } from '@/hooks/useUserContext';
import AppBreadcrumb from './Breadcrums';
import Navigation from './navigation';
import Sidebar from './Sidebar';
import ModalContextProvider from '@/contexts/modal';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token } = useUserContext();

  if (token) {
    return (
      <ModalContextProvider>
        <Sidebar />
        <div id="content" className="flex flex-col h-screen overflow-hidden">
          <div className="flex-none mt-1">
            <Navigation />
            <AppBreadcrumb />
          </div>
          <div className="flex-grow overflow-hidden">{children}</div>
        </div>
      </ModalContextProvider>
    );
  } else {
    return <ModalContextProvider>{children}</ModalContextProvider>;
  }
}
