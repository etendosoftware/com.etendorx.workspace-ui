'use client';

import { useParams } from 'next/navigation';
import AppBreadcrumb from './Breadcrums';
import Navigation from './navigation';
import Sidebar from './Sidebar';
import { Toolbar } from './Toolbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { windowId } = useParams<{
    windowId: string;
    tabId: string;
    recordId: string;
  }>();

  return (
    <>
      <Sidebar />
      <div id="content">
        <Navigation />
        <AppBreadcrumb />
        <Toolbar windowId={windowId} />
        {children}
      </div>
    </>
  );
}
