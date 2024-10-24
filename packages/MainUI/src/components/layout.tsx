'use client';

import AppBreadcrumb from '@/components/Breadcrums';
import Sidebar from '@/components/Sidebar';
import Navigation from '@/components/navigation';
import { Box } from '@mui/material';

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
