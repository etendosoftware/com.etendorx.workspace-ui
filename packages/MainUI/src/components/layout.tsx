import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Navigation from './navigation';

export default function Layout() {
  return (
    <>
      <Sidebar />
      <div id="content">
        <Navigation />
        <Outlet />
      </div>
    </>
  );
}
