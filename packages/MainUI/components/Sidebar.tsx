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

  // ✅ Usar el nuevo hook para múltiples ventanas
  const { activeWindow, openWindow } = useMultiWindowURL();

  const [searchValue, setSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    const result = filterItems(menu, searchValue, searchIndex);
    return result;
  }, [menu, searchValue, searchIndex]);

  // ✅ Actualizar handleClick para usar la nueva API
  const handleClick = useCallback(
    (item: Menu) => {
      const windowId = item.windowId ?? "";

      if (!windowId) {
        console.warn("Menu item without windowId:", item);
        return;
      }

      // ✅ Usar openWindow en lugar de manipular URL manualmente
      if (pathname.includes("window")) {
        // Ya estamos en la página de ventanas, solo abrir/activar la ventana
        openWindow(windowId, item.name);
      } else {
        // Navegar a la página de ventanas y abrir la ventana
        router.push("/window");
        // Usar setTimeout para asegurar que la navegación ocurra primero
        setTimeout(() => {
          openWindow(windowId, item.name);
        }, 0);
      }
    },
    [pathname, router, openWindow]
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

  // ✅ Pasar windowId del activeWindow para compatibilidad con Drawer
  const currentWindowId = activeWindow?.windowId;

  return (
    <Drawer
      windowId={currentWindowId} // ✅ Usar windowId de la ventana activa
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
