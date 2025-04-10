'use client';

import { useUserContext } from '@/hooks/useUserContext';
import AppBreadcrumb from './Breadcrums';
import Navigation from './navigation';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token } = useUserContext();

  if (token) {
    return (
      <>
        <Sidebar />
        <div id="content" className="flex flex-col h-screen overflow-hidden">
          <div className="flex-none">
            <Navigation />
            <AppBreadcrumb />
          </div>
          <div className="flex-grow overflow-hidden">{children}</div>
        </div>
      </>
    );
  } else {
    return <>{children}</>;
  }
}
