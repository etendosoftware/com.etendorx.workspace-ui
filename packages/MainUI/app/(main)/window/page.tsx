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
import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import Loading from "@/components/loading";
import WindowTabs from "@/components/NavigationTabs/WindowTabs";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useQueryParams } from "@/hooks/useQueryParams";
import Home from "@/screens/Home";
import { useTranslation } from "@/hooks/useTranslation";
import Window from "@/components/window/Window";
import TabsProvider from "@/contexts/tabs";
import TableStatePersistenceProvider from "@/contexts/tableStatePersistence";

export default function Page() {
  const { loading, error } = useMetadataContext();
  const { windows, activeWindow, isHomeRoute, openWindow } = useMultiWindowURL();
  const { windowId } = useQueryParams<{ windowId?: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    if (windowId && windows.length === 0) {
      openWindow(windowId);
    }
  }, [windowId, windows.length, openWindow]);

  if (loading) {
    return <Loading data-testid={`Loading__${activeWindow?.windowId ?? windowId ?? "351d9c"}`} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title={error?.message ?? t("errors.internalServerError.title")}
        data-testid={`ErrorDisplay__${activeWindow?.windowId ?? windowId ?? "351d9c"}`}
      />
    );
  }

  const shouldShowTabs = windows.length > 0;

  return (
    <TableStatePersistenceProvider>
      <div className="flex flex-col gap-2 w-full h-full max-h-full p-1 pb-0">
        {shouldShowTabs && (
          <TabsProvider data-testid={`TabsProvider__${activeWindow?.windowId ?? windowId ?? "351d9c"}`}>
            <WindowTabs data-testid={`WindowTabs__${activeWindow?.windowId ?? windowId ?? "351d9c"}`} />
          </TabsProvider>
        )}
        {isHomeRoute || !activeWindow ? (
          <Home data-testid={`Home__${activeWindow?.windowId ?? windowId ?? "351d9c"}`} />
        ) : (
          <Window
            windowId={activeWindow.windowId}
            data-testid={`Window__${activeWindow?.windowId ?? windowId ?? "351d9c"}`}
          />
        )}
      </div>
    </TableStatePersistenceProvider>
  );
}
