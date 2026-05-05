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
import type { ProcessIframeModalProps, ProcessDefinitionButton, ProcessType } from "./ProcessModal/types";
import formsData from "../utils/processes/forms/data.json";
import { useRuntimeConfig } from "../contexts/RuntimeConfigContext";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import ProcessDefinitionModal from "./ProcessModal/ProcessDefinitionModal";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { FavoritesDrawerContext } from "@workspaceui/componentlibrary/src/components/Drawer/FavoritesDrawerContext";
import { useFavoritesContext } from "@/contexts/favorites";
import { MENU_ITEM_TYPES } from "@/utils/menu/menuItemTypes";
import { type ExtendedMenu, MENU_CLICK_INTENT_KINDS, resolveMenuClickIntent } from "@/utils/menu/menuItemDispatch";

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

interface ManualProcessResult {
  url: string;
  size: "default" | "large";
}

/**
 * Gets the iframe configuration for legacy manual processes (Process/Form types).
 * Process Definition entries are handled separately via ProcessDefinitionModal.
 */
const getManualProcessConfig = (
  item: ExtendedMenu,
  token: string | null,
  baseUrl: string
): ManualProcessResult | null => {
  if (item.type === MENU_ITEM_TYPES.PROCESS && item.processId) {
    return {
      url: buildProcessUrl(item.processId, token, baseUrl),
      size: "default",
    };
  }

  if (item.type === MENU_ITEM_TYPES.FORM && item.formId) {
    const url = buildFormUrl(item.formId, token, baseUrl);
    if (!url) return null;
    return { url, size: "large" };
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
  const [showProcessDefinitionModal, setShowProcessDefinitionModal] = useState(false);
  const [selectedProcessDefinitionButton, setSelectedProcessDefinitionButton] =
    useState<ProcessDefinitionButton | null>(null);
  const [processType, setProcessType] = useState<ProcessType>("");

  const { config } = useRuntimeConfig();

  const ETENDO_BASE_URL = config?.etendoClassicHost || "";

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    const result = filterItems(menu, searchValue, searchIndex);
    return result;
  }, [menu, searchValue, searchIndex]);

  /**
   * Handles closing the ProcessDefinitionModal
   */
  const handleCloseProcessDefinitionModal = useCallback(() => {
    setShowProcessDefinitionModal(false);
    setSelectedProcessDefinitionButton(null);
  }, []);

  /**
   * Opens the ProcessDefinitionModal for a process-like menu intent. Centralises
   * the state setters so the click handler stays focused on dispatch.
   *
   * @param button       The minimal {@link ProcessDefinitionButton} to display.
   * @param processType  Modal mode (Process Definition or Report and Process).
   */
  const openProcessModal = useCallback((button: ProcessDefinitionButton, processType: ProcessType) => {
    setSelectedProcessDefinitionButton(button);
    setProcessType(processType);
    setShowProcessDefinitionModal(true);
  }, []);

  /**
   * Handles menu item clicks and window navigation.
   *
   * Manages different navigation scenarios:
   * 1. Pick and Execute items: Opens ProcessDefinitionModal (P&E branch)
   * 2. ProcessDefinition / Report and Process items: Opens ProcessDefinitionModal (generic branch)
   * 3. Process / Form items: Opens ProcessIframeModal (legacy implementation)
   * 4. ProcessManual / Report items: Opens Etendo Classic in a popup or new tab
   * 5. Window items: Opens/activates window using multi-window system
   *
   * Features optimistic UI updates by immediately setting pendingWindowId
   * for visual feedback before state synchronization completes.
   *
   * @param item - Menu item that was clicked
   */
  const handleClick = useCallback(
    (item: Menu) => {
      const extendedItem = item as ExtendedMenu;

      const intent = resolveMenuClickIntent(extendedItem);
      if (intent.kind === MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE) {
        openProcessModal(intent.button, PROCESS_TYPES.PROCESS_DEFINITION);
        return;
      }
      if (intent.kind === MENU_CLICK_INTENT_KINDS.PROCESS_DEFINITION) {
        openProcessModal(intent.button, intent.processType);
        return;
      }

      // Handle legacy manual processes (Form / Process) with iframe
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

      // Handle ProcessManual / Report items - open in Etendo Classic
      const processUrl = getManualProcessUrl(item);
      const isClassicProcess = item.type === MENU_ITEM_TYPES.PROCESS_MANUAL || item.type === MENU_ITEM_TYPES.REPORT;
      if (isClassicProcess && processUrl) {
        const classicUrl = buildEtendoClassicBookmarkUrl({
          baseUrl: ETENDO_BASE_URL,
          processUrl,
          tabTitle: item.name,
          token: token,
          kioskMode: true,
        });
        if (item.isModalProcess) {
          window.open(classicUrl, "Test", "width=950,height=700");
          return;
        }
        window.open(classicUrl, "_blank");
        return;
      }

      if (item.type !== MENU_ITEM_TYPES.WINDOW) {
        return;
      }

      const windowId = item.windowId ?? "";

      if (!windowId) {
        return;
      }

      setPendingWindowId(windowId);

      const newWindowIdentifier = getNewWindowIdentifier(windowId);
      setWindowActive({ windowIdentifier: newWindowIdentifier, windowData: { title: item.name, initialized: true } });
    },
    [token, ETENDO_BASE_URL, setWindowActive, openProcessModal]
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

  const { isFavorite, toggle, setMenuMap } = useFavoritesContext();

  // Build windowId→menuId map from the flat menu tree so the breadcrumb
  // can look up the menuId for the current window without prop drilling.
  useEffect(() => {
    function collect(items: Menu[], map: Map<string, string>) {
      for (const item of items) {
        if (item.windowId) map.set(item.windowId, item.id);
        if (item.children?.length) collect(item.children, map);
      }
    }
    const map = new Map<string, string>();
    collect(menu, map);
    setMenuMap(map);
  }, [menu, setMenuMap]);

  const favoritesDrawerValue = useMemo(
    () => ({
      isFavorite,
      toggle: (item: Menu) => {
        if (item.windowId) toggle(item.id, item.windowId);
      },
    }),
    [isFavorite, toggle]
  );

  return (
    <FavoritesDrawerContext.Provider value={favoritesDrawerValue}>
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
        <ProcessDefinitionModal
          type={processType}
          open={showProcessDefinitionModal}
          onClose={handleCloseProcessDefinitionModal}
          button={selectedProcessDefinitionButton}
          data-testid="ProcessDefinitionModal__sidebar"
        />
      </>
    </FavoritesDrawerContext.Provider>
  );
}
