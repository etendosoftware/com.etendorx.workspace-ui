import AppBreadcrumb from './Breadcrums';
import Navigation from './navigation';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-full relative overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col max-w-auto max-h-auto overflow-hidden">
        <div className="w-full p-1">
          <Navigation />
          <AppBreadcrumb />
        </div>
        <div className="flex flex-1 max-h-auto max-w-auto overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
