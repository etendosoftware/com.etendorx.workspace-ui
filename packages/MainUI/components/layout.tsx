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

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-full relative overflow-hidden">
      <GlobalLoading data-testid="GlobalLoading__519d5c" />
      <Sidebar data-testid="Sidebar__519d5c" />
      <div className="flex flex-1 flex-col max-w-auto max-h-auto overflow-hidden">
        <div className="w-full h-14 min-h-14 p-1">
          <Navigation data-testid="Navigation__519d5c" />
        </div>
        <div className="flex flex-1 max-h-auto max-w-auto overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent data-testid="LayoutContent__519d5c">{children}</LayoutContent>;
}
