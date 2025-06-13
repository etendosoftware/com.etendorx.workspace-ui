"use client";

import AppBreadcrumb from "./Breadcrums";
import Navigation from "./navigation";
import Sidebar from "./Sidebar";
import { NavigationTabs } from "./NavigationTabs";
import { useEffect } from "react";
import { useNavigationTabPersistence } from "@/hooks/navigation/useNavigationTabPersistence";
import { useNavigationTabsSync } from "@/hooks/navigation/useNavigationTabSync";

function LayoutContent({ children }: { children: React.ReactNode }) {
  useNavigationTabsSync();

  const { restoreTabs } = useNavigationTabPersistence();

  useEffect(() => {
    restoreTabs();
  }, [restoreTabs]);

  return (
    <div className="flex w-full h-full relative overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col max-w-auto max-h-auto overflow-hidden">
        <div className="w-full p-1">
          {/* Agregar NavigationTabs aquí, antes de Navigation */}
          <NavigationTabs />
          <Navigation />
          <AppBreadcrumb />
        </div>
        <div className="flex flex-1 max-h-auto max-w-auto overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}
