"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "@workspaceui/componentlibrary/src/components/Drawer/index";
import EtendoLogotype from "../public/etendo.png";
import { useTranslation } from "../hooks/useTranslation";
import { useUserContext } from "../hooks/useUserContext";
import { RecentlyViewed } from "./Drawer/RecentlyViewed";
import type { Menu } from "@workspaceui/etendohookbinder/src/api/types";
import { useMenuTranslation } from "../hooks/useMenuTranslation";
import { createSearchIndex, filterItems } from "@workspaceui/componentlibrary/src/utils/searchUtils";
import { useLanguage } from "@/contexts/language";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { useMenu } from "@/hooks/useMenu";

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole, prevRole } = useUserContext();
  const { language, prevLanguage } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();
  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const pathname = usePathname();

  const { activeWindow, openWindow, buildURL } = useMultiWindowURL();

  const [searchValue, setSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

      if (isInWindowRoute) {
        openWindow(windowId, item.name);
      } else {
        const newWindow = {
          windowId,
          isActive: true,
          title: item.name,
          selectedRecords: {},
          tabFormStates: {},
        };

        const targetURL = buildURL([newWindow]);

        router.push(targetURL);
      }
    },
    [pathname, router, openWindow, buildURL]
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

  return (
    <Drawer
      windowId={currentWindowId}
      logo={EtendoLogotype.src}
      title={t("common.etendo")}
      items={menu}
      onClick={handleClick}
      onReportClick={handleClick}
      onProcessClick={handleClick}
      getTranslatedName={getTranslatedName}
      RecentlyViewedComponent={RecentlyViewed}
      searchContext={searchContext}
    />
  );
}
