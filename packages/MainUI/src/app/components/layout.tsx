'use client';

import { Navigation } from '@mui/icons-material';
import AppBreadcrumb from 'src/app/components/Breadcrums';
import Sidebar from '../components/Sidebar';

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
