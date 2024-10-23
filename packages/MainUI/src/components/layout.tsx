'use client';

import AppBreadcrumb from '@/components/Breadcrums';
import Sidebar from '@/components/Sidebar';
import Navigation from '@/components/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div id="content">
        <Navigation />
        <AppBreadcrumb />
        {children}
      </div>
    </>
  );
}
