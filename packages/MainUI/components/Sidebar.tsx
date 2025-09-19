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

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "@workspaceui/componentlibrary/src/components/Drawer/index";
import EtendoLogotype from "../public/etendo.png";
import { useTranslation } from "../hooks/useTranslation";
import { useUserContext } from "../hooks/useUserContext";
import { RecentlyViewed } from "./Drawer/RecentlyViewed";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useMenuTranslation } from "../hooks/useMenuTranslation";
import { createSearchIndex, filterItems } from "@workspaceui/componentlibrary/src/utils/searchUtils";
import { useLanguage } from "@/contexts/language";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useMenu } from "@/hooks/useMenu";
import Version from "@workspaceui/componentlibrary/src/components/Version";

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole, prevRole } = useUserContext();
  const { language, prevLanguage } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();
  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const pathname = usePathname();

  const { activeWindow, openWindow, buildURL, getNextOrder, windows } = useMultiWindowURL();

  const [searchValue, setSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pendingWindowId, setPendingWindowId] = useState<string | undefined>(undefined);

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    const result = filterItems(menu, searchValue, searchIndex);
    return result;
  }, [menu, searchValue, searchIndex]);

  const handleClick = useCallback(
    (item: Menu) => {
      const windowId = item.windowId ?? "";

      if (!windowId) {
        console.warn("Menu item without windowId:", item);
        return;
      }

      const isInWindowRoute = pathname.includes("window");

      // Immediate feedback: set optimistic selected until activeWindow updates
      if (windowId) {
        setPendingWindowId(windowId);
      }

      if (isInWindowRoute) {
        openWindow(windowId, item.name);
      } else {
        const newWindow = {
          windowId,
          window_identifier: item.name,
          isActive: true,
          order: getNextOrder(windows),
          title: item.name,
          selectedRecords: {},
          tabFormStates: {},
        };

        const targetURL = buildURL([newWindow]);

        router.push(targetURL);
      }
    },
    [pathname, router, windows, openWindow, buildURL, getNextOrder]
  );

  const searchContext = useMemo(
    () => ({
      searchValue,
      setSearchValue,
      filteredItems,
      searchExpandedItems,
      expandedItems,
      setExpandedItems,
      searchIndex,
    }),
    [expandedItems, filteredItems, searchExpandedItems, searchIndex, searchValue]
  );

  const getTranslatedName = useCallback((item: Menu) => translateMenuItem(item), [translateMenuItem]);

  useEffect(() => {
    if ((prevRole && prevRole?.id !== currentRole?.id) || prevLanguage !== language) {
      setSearchValue("");
    }
  }, [currentRole?.id, language, prevLanguage, prevRole]);

  const currentWindowId = activeWindow?.windowId;

  // Clear optimistic selection when the active window matches
  useEffect(() => {
    if (pendingWindowId && currentWindowId === pendingWindowId) {
      setPendingWindowId(undefined);
    }
  }, [currentWindowId, pendingWindowId]);

  return (
    <Drawer
      windowId={currentWindowId}
      pendingWindowId={pendingWindowId}
      logo={EtendoLogotype.src}
      title={t("common.etendo")}
      items={menu}
      onClick={handleClick}
      onReportClick={handleClick}
      onProcessClick={handleClick}
      getTranslatedName={getTranslatedName}
      RecentlyViewedComponent={RecentlyViewed}
      VersionComponent={() => <Version version={`${t("common.version")} ${process.env.NEXT_PUBLIC_APP_VERSION}`} />}
      searchContext={searchContext}
      data-testid="Drawer__6c6035"
    />
  );
}
