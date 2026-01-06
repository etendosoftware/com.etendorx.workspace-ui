"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "@workspaceui/componentlibrary/src/components/Drawer/index";
import EtendoLogotype from "../public/etendo.png";
import { useTranslation } from "../hooks/useTranslation";
import { useUserContext } from "../hooks/useUserContext";
import { RecentlyViewed } from "./Drawer/RecentlyViewed";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { useMenuTranslation } from "../hooks/useMenuTranslation";
import { createSearchIndex, filterItems } from "@workspaceui/componentlibrary/src/utils/searchUtils";
import { useLanguage } from "@/contexts/language";
import { useMenu } from "@/hooks/useMenu";
import Version from "@workspaceui/componentlibrary/src/components/Version";
import type { VersionProps } from "@workspaceui/componentlibrary/src/interfaces";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { buildEtendoClassicBookmarkUrl } from "@/utils/url/utils";
import { useWindowContext } from "@/contexts/window";
import ProcessIframeModal from "./ProcessModal/Iframe";
import type { ProcessIframeModalProps } from "./ProcessModal/types";
import formsData from "../utils/processes/forms/data.json";
import { useRuntimeConfig } from "../contexts/RuntimeConfigContext";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";

interface ExtendedMenu extends Menu {
  processDefinitionId?: string;
  formId?: string;
  processId?: string;
  description?: string;
}

interface FormData {
  url: string;
  paramUrl: string;
  noprefs: string;
  hideMenu: string;
  command: string;
}

const buildProcessUrl = (processId: string, token: string | null, baseUrl: string): string => {
  const params = new URLSearchParams({
    Command: `BUTTON${processId}`,
    IsPopUpCall: "1",
  });
  if (token) {
    params.append("token", token);
  }
  return `${baseUrl}${API_IFRAME_FORWARD_PATH}/ad_actionButton/ActionButton_Responser.html?${params.toString()}`;
};

const buildFormUrl = (formId: string, token: string | null, baseUrl: string): string | null => {
  const formData = (formsData as Record<string, FormData>)[formId];
  if (!formData) {
    return null;
  }

  const { url, paramUrl, noprefs, hideMenu, command } = formData;

  const params = new URLSearchParams({
    noprefs,
    hideMenu,
    Command: command,
  });

  if (token) {
    params.append("token", token);
  }
  return `${baseUrl}${API_IFRAME_FORWARD_PATH}${url}?url=${paramUrl}&${params.toString()}`;
};

const buildProcessDefinitionUrl = (processDefId: string, token: string | null, baseUrl: string): string => {
  const viewId = `processDefinition_${processDefId}`;
  const params = new URLSearchParams({ viewId });
  if (token) {
    params.append("token", token);
  }
  const processPath = "/org.openbravo.client.kernel/OBUIAPP_MainLayout/View";
  return `${baseUrl}${processPath}?${params.toString()}`;
};

interface ManualProcessResult {
  url: string;
  size: "default" | "large";
}

const getManualProcessConfig = (
  item: ExtendedMenu,
  token: string | null,
  baseUrl: string
): ManualProcessResult | null => {
  if (item.type === "Process" && item.processId) {
    return {
      url: buildProcessUrl(item.processId, token, baseUrl),
      size: "default",
    };
  }

  if (item.type === "Form" && item.formId) {
    const url = buildFormUrl(item.formId, token, baseUrl);
    if (!url) return null;
    return { url, size: "large" };
  }

  if (item.type === "ProcessDefinition" && item.processDefinitionId) {
    return {
      url: buildProcessDefinitionUrl(item.processDefinitionId, token, baseUrl),
      size: "default",
    };
  }

  return null;
};

const getManualProcessUrl = (item: ExtendedMenu): string | null => {
  return item.processUrl || null;
};

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
  const { activeWindow, setWindowActive } = useWindowContext();

  const [searchValue, setSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pendingWindowId, setPendingWindowId] = useState<string | undefined>(undefined);
  const [processIframeModal, setProcessIframeModal] = useState<ProcessIframeModalProps>({ isOpen: false });

  const { config } = useRuntimeConfig();

  const ETENDO_BASE_URL = config?.etendoClassicHost || "";

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
      const extendedItem = item as ExtendedMenu;

      // Handle manual processes (Form / ProcessDefinition / Process)
      const processConfig = getManualProcessConfig(extendedItem, token, ETENDO_BASE_URL);
      if (processConfig) {
        setProcessIframeModal({
          isOpen: true,
          url: processConfig.url,
          title: extendedItem.name,
          tabId: "",
          size: processConfig.size,
          onClose: () => setProcessIframeModal({ isOpen: false }),
        });
        return;
      }

      // Handle ProcessManual items - open in Etendo Classic
      const processUrl = getManualProcessUrl(item);
      if (item.type === "ProcessManual" && processUrl) {
        const classicUrl = buildEtendoClassicBookmarkUrl(ETENDO_BASE_URL, processUrl, item.name, true);
        // Open in modal
        if (item.isModalProcess) {
          setProcessIframeModal({
            isOpen: true,
            url: classicUrl,
            title: extendedItem.name,
            tabId: "",
            size: "default",
            onClose: () => setProcessIframeModal({ isOpen: false }),
          });
          return;
        }

        // Fallback: Open in new tab
        window.open(classicUrl, "_blank");
      }

      const windowId = item.windowId ?? "";

      if (!windowId) {
        return;
      }

      if (windowId) {
        setPendingWindowId(windowId);
      }

      const newWindowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData: { title: item.name, initialized: true } });
    },
    [token, ETENDO_BASE_URL, setWindowActive]
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

  useEffect(() => {
    if (pendingWindowId && currentWindowId === pendingWindowId) {
      setPendingWindowId(undefined);
    }
  }, [currentWindowId, pendingWindowId]);

  return (
    <>
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
      <ProcessIframeModal {...processIframeModal} data-testid="ProcessIframeModal__sidebar" />
    </>
  );
}
