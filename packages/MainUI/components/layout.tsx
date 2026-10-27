/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";
import Navigation from "./navigation";
import Sidebar from "./Sidebar";
import GlobalLoading from "./Layout/GlobalLoading";
import ProcessStackHost from "./ProcessModal/ProcessStackHost";
import HelpDrawer from "./HelpDrawer/HelpDrawer";
import InstancePurposeModal from "./InstancePurpose/InstancePurposeModal";
import { useMemo, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import ThemeToggle from "./ThemeToggle";
import { TopBarSlotsContext } from "@/contexts/TitleActionsSlot";

/** Thin status bar under the workspace: app version and signed-in user. */
function StatusBar({ onFooterRef }: { onFooterRef: (element: HTMLElement | null) => void }) {
  const name = useUserStore((s) => s.profile.name);
  return (
    <div
      className="flex h-7 min-h-7 w-full items-center justify-end gap-6 border-t border-(--ui-line) bg-(--ui-footer-bg) px-4 text-xs text-(--ui-text-muted)"
      data-testid="StatusBar__container">
      <div ref={onFooterRef} className="mr-auto flex items-center" data-testid="FooterSlot__counter" />
      <span>Version: {process.env.NEXT_PUBLIC_APP_VERSION}</span>
      {name && <span>User {name}</span>}
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<HTMLElement | null>(null);
  const [pagination, setPagination] = useState<HTMLElement | null>(null);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  const [titleSuffix, setTitleSuffix] = useState<HTMLElement | null>(null);
  const slots = useMemo(() => ({ title, titleSuffix, footer, pagination }), [title, titleSuffix, footer, pagination]);

  return (
    <TopBarSlotsContext.Provider value={slots}>
      <div className="flex w-full h-full relative overflow-hidden">
        <GlobalLoading data-testid="GlobalLoading__519d5c" />
        <Sidebar data-testid="Sidebar__519d5c" />
        <div className="flex flex-1 flex-col max-w-auto max-h-auto overflow-hidden" data-shortcut-root="true">
          <div className="flex w-full h-14 min-h-14 items-center gap-3 px-3 bg-(--ui-topbar-bg) border-b border-(--ui-topbar-line)">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div ref={setTitle} className="min-w-0" data-testid="TopBarSlot__title" />
              <div ref={setTitleSuffix} className="shrink-0" data-testid="TopBarSlot__titleSuffix" />
            </div>
            <div ref={setPagination} className="shrink-0 flex items-center" data-testid="TopBarSlot__pagination" />
            <div className="shrink-0">
              <ThemeToggle data-testid="ThemeToggle__519d5c" />
            </div>
            <div className="h-full shrink-0 [&_nav_button]:bg-(--ui-nav-btn-bg) [&_nav_button:hover]:bg-(--ui-nav-btn-hover)">
              <Navigation data-testid="Navigation__519d5c" />
            </div>
          </div>
          <div className="flex flex-1 max-h-auto max-w-auto overflow-hidden">{children}</div>
          <StatusBar onFooterRef={setFooter} data-testid="StatusBar__519d5c" />
        </div>
        <HelpDrawer data-testid="HelpDrawer__519d5c" />
        {/* Host for nested process modals opened via view.openProcess. */}
        <ProcessStackHost data-testid="ProcessStackHost__519d5c" />
        {/* First-login modal asking system administrators for the purpose of the instance. */}
        <InstancePurposeModal data-testid="InstancePurposeModal__519d5c" />
      </div>
    </TopBarSlotsContext.Provider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent data-testid="LayoutContent__519d5c">{children}</LayoutContent>;
}
