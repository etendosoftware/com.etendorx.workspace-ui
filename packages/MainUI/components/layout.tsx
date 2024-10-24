'use client';

import AppBreadcrumb from './Breadcrums';
import Navigation from './navigation';
import Sidebar from './Sidebar';

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
