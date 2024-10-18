import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Navigation from './navigation';
import AppBreadcrumb from './Breadcrums';

export default function Layout() {
  return (
    <>
      <Sidebar />
      <div id="content">
        <Navigation />
        <AppBreadcrumb />
        <Outlet />
      </div>
    </>
  );
}
