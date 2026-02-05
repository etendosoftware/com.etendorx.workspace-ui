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
// @data-testid-ignore
"use client";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useWindowContext } from "@/contexts/window";
import Home from "@/screens/Home";
import Window from "@/components/window/Window";
import TabsProvider from "@/contexts/tabs";
import Loading from "@/components/loading";

export default function Page() {
  const { windows, activeWindow, isHomeRoute, isRecoveryLoading } = useWindowContext();

  const shouldShowTabs = windows.length > 0;

  const shouldShowWindow = activeWindow && !isHomeRoute;

  if (isRecoveryLoading && !activeWindow) {
    return <Loading data-testid="Loading__Recovery" />;
  }

  return (
    <div className="flex flex-col gap-2 w-full h-full max-h-full p-1 pb-0">
      {shouldShowTabs && (
        <TabsProvider data-testid={`TabsProvider__${activeWindow?.windowIdentifier ?? "351d9c"}`}>
          <WindowTabs data-testid={`WindowTabs__${activeWindow?.windowIdentifier ?? "351d9c"}`} />
        </TabsProvider>
      )}
      <div className="flex-1 min-h-0 relative">
        {windows.map((win) => (
          <div
            key={win.windowIdentifier}
            className={`absolute inset-0 ${win.isActive && !isHomeRoute ? "flex flex-col" : "hidden"}`}
            data-testid={`WindowWrapper__${win.windowIdentifier}`}>
            <Window window={win} data-testid={`Window__${win.windowIdentifier}`} />
          </div>
        ))}
        {(isHomeRoute || windows.length === 0) && (
          <div className="absolute inset-0 block" data-testid="HomeWrapper">
            <Home data-testid={`Home__${activeWindow?.windowIdentifier ?? "351d9c"}`} />
          </div>
        )}
      </div>
    </div>
  );
}
