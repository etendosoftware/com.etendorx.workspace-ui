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
import type { VersionProps } from "@workspaceui/componentlibrary/src/interfaces";
import { getNewWindowIdentifier } from "@/utils/url/utils";
import { useWindowContext } from "@/contexts/window";

/**
 * Version component that displays the current application version in the sidebar footer.
 * Renders the version information with internationalization support.
 *
 * @returns A Version component with translated title and current app version
 */
const VersionComponent: React.FC<VersionProps> = () => {
  const { t } = useTranslation();
  return (
    <Version title={`${t("common.version")} ${process.env.NEXT_PUBLIC_APP_VERSION}`} data-testid="Version__6c6035" />
  );
};

/**
 * Main Sidebar Component for Etendo WorkspaceUI
 *
 * Provides the primary navigation interface for the Etendo ERP system, featuring:
 * - Hierarchical menu navigation with search capabilities
 * - Multi-window management and navigation
 * - Recently viewed items tracking
 * - Real-time language and role switching
 * - Optimistic UI updates for better user experience
 *
 * The sidebar integrates with Etendo Classic backend to fetch menu metadata
 * and manages complex navigation states through URL parameters, supporting
 * multiple concurrent windows with persistent state.
 *
 * @returns The complete sidebar navigation component
 */
export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole, prevRole } = useUserContext();
  const { language, prevLanguage } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();
  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const pathname = usePathname();
  const { activeWindow, openWindow, buildURL } = useMultiWindowURL();
  const { setWindowActive } = useWindowContext();

  const [searchValue, setSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pendingWindowId, setPendingWindowId] = useState<string | undefined>(undefined);

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    const result = filterItems(menu, searchValue, searchIndex);
    return result;
  }, [menu, searchValue, searchIndex]);

  /**
   * Handles menu item clicks and window navigation.
   *
   * Manages two navigation scenarios:
   * 1. When already in window route: Opens/activates window using multi-window system
   * 2. When in home route: Creates new window and navigates to window route
   *
   * Features optimistic UI updates by immediately setting pendingWindowId
   * for visual feedback before state synchronization completes.
   *
   * @param item - Menu item that was clicked, must contain windowId
   */
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

      const newWindowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData: { title: item.name } });

      // TODO: delete this code when multi-window is fully stable
      if (isInWindowRoute) {
        // Already in window context - use multi-window system
        openWindow(windowId, newWindowIdentifier, item.name);
      } else {
        // Coming from home route - create new window and navigate
        const newWindow = {
          windowId,
          window_identifier: newWindowIdentifier,
          isActive: true,
          title: item.name,
          selectedRecords: {},
        };

        const targetURL = buildURL([newWindow]);
        router.push(targetURL);
      }
    },
    [pathname, router, openWindow, buildURL, setWindowActive]
  );

  /**
   * Memoized search context object passed to the Drawer component.
   *
   * Contains all search-related state and functions:
   * - searchValue: Current search input
   * - setSearchValue: Function to update search input
   * - filteredItems: Menu items matching search criteria
   * - searchExpandedItems: Items expanded due to search results
   * - expandedItems: User-manually expanded items
   * - setExpandedItems: Function to update expanded items
   * - searchIndex: Pre-computed search index for performance
   */
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

  /**
   * Memoized callback to get translated menu item names.
   * Wraps the translateMenuItem function for consistent usage across the component.
   *
   * @param item - Menu item to translate
   * @returns Translated name for the menu item
   */
  const getTranslatedName = useCallback((item: Menu) => translateMenuItem(item), [translateMenuItem]);

  /**
   * Effect to reset search when role or language changes.
   *
   * Clears the search input when:
   * - User switches to a different role (different menu permissions)
   * - User changes the interface language (menu items need retranslation)
   *
   * This ensures a clean slate when the menu context fundamentally changes.
   */
  useEffect(() => {
    if ((prevRole && prevRole?.id !== currentRole?.id) || prevLanguage !== language) {
      setSearchValue("");
    }
  }, [currentRole?.id, language, prevLanguage, prevRole]);

  const currentWindowId = activeWindow?.windowId;

  /**
   * Effect to clear optimistic UI state when navigation completes.
   *
   * Clears the pendingWindowId when the activeWindow state matches
   * the pending selection, indicating that the navigation has completed
   * and the optimistic state is no longer needed.
   */
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
      VersionComponent={VersionComponent}
      searchContext={searchContext}
      data-testid="Drawer__6c6035"
    />
  );
}
