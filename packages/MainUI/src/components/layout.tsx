'use client';

import { Navigation } from '@mui/icons-material';
import AppBreadcrumb from '@/components/Breadcrums';
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
